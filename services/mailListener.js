const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");

const Email = require("../models/Email");

const replyEngine = require("./replyEngine");
const sendMail = require("./mailSender");

const {
    getConversation,
    saveConversation
} = require("./conversationService");



let client;

let reconnecting = false;



function createClient() {

    return new ImapFlow({

        host: process.env.IMAP_HOST,

        port: Number(process.env.IMAP_PORT),

        secure: true,


        auth: {
            user: process.env.IMAP_EMAIL,
            pass: process.env.IMAP_PASSWORD
        },


        logger: false,


        tls: {

            rejectUnauthorized: false

        }

    });

}




async function connectIMAP() {


    if (client) {

        try {

            await client.logout();

        }
        catch { }

    }



    client = createClient();



    client.on(
        "error",
        (error) => {

            console.error(
                "❌ IMAP Error:",
                error.message
            );

        }
    );



    client.on(
        "close",
        () => {

            console.log(
                "⚠️ IMAP Connection Closed"
            );


            reconnect();

        }
    );



    await client.connect();


    console.log(
        "✅ Connected to IMAP Server"
    );



    await client.mailboxOpen(
        "INBOX"
    );


    console.log(
        "📩 Inbox Opened"
    );


}




async function reconnect() {


    if (reconnecting)
        return;


    reconnecting = true;



    try {


        await new Promise(
            resolve => setTimeout(resolve, 5000)
        );


        console.log(
            "🔄 Reconnecting IMAP..."
        );



        await startListener();



    }

    catch (error) {


        console.error(
            "Reconnect Failed:",
            error.message
        );


    }


    finally {


        reconnecting = false;


    }


}









async function processEmail(uid) {


    try {


        const message =
            await client.fetchOne(
                uid,
                {
                    source: true
                }
            );



        if (!message) {

            console.log(
                "Email not found"
            );

            return;

        }



        const parsed =
            await simpleParser(
                message.source
            );



        const from =
            parsed.from?.value?.[0];



        if (!from)
            return;



        const senderEmail =
            from.address
                .toLowerCase()
                .trim();



        const senderName =
            from.name || "User";



        /*
            Prevent Bot Loop
        */

        if (
            senderEmail ===
            process.env.EMAIL.toLowerCase()
        ) {

            console.log(
                "Ignoring own email"
            );

            return;

        }





        const subject =
            parsed.subject || "No Subject";



        const text =
            parsed.text || "";




        console.log(
            "\n📩 New Email"
        );


        console.log(
            "From:",
            senderEmail
        );


        console.log(
            "Subject:",
            subject
        );





        /*
            Duplicate Check
        */


        const exists =
            await Email.findOne({
                uid
            });



        if (exists) {


            console.log(
                "⚠️ Already Processed"
            );


            return;

        }






        /*
            Conversation Memory
        */


        const conversation =
            await getConversation(
                senderEmail
            );



        const history =
            conversation
                ?
                conversation.messages
                :
                [];







        /*
            Generate Reply
        */


        const generatedReply =
            await replyEngine({

                name: senderName,

                email: senderEmail,

                subject,

                message: text,

                history

            });





        let replySubject =
            "Re: " + subject;


        let replyMessage = "";




        if (
            typeof generatedReply === "object"
        ) {

            replySubject =
                generatedReply.subject ||
                replySubject;


            replyMessage =
                generatedReply.message || "";

        }

        else {


            replyMessage =
                String(generatedReply);

        }







        if (!replyMessage) {


            console.log(
                "No reply generated"
            );


            return;

        }







        /*
            Send Reply
        */


        await sendMail({

            to: senderEmail,

            subject: replySubject,

            text: replyMessage

        });




        console.log(
            "📤 Reply Sent"
        );








        /*
            Save Conversation
        */


        await saveConversation({

            email: senderEmail,

            name: senderName,

            subject,

            userMessage: text,

            botReply: replyMessage

        });







        /*
            Mark Processed
        */


        await Email.create({

            uid,

            sender: senderEmail,

            senderName,

            subject,

            message: text,

            replySent: true,

            reply: replyMessage

        });




        console.log(
            "✅ Email Completed"
        );



    }


    catch (error) {


        console.error(
            "❌ Processing Error:",
            error.message
        );


    }


}









async function startListener() {


    await connectIMAP();



    client.on(
        "exists",
        async () => {


            console.log(
                "📨 New Email Detected"
            );



            const lock =
                await client.getMailboxLock(
                    "INBOX"
                );



            try {


                const status =
                    await client.status(
                        "INBOX",
                        {
                            uidNext: true
                        }
                    );



                const uid =
                    status.uidNext - 1;




                await processEmail(uid);



            }


            catch (error) {


                console.error(
                    "Listener Error:",
                    error.message
                );


            }


            finally {


                lock.release();


            }


        }
    );



    console.log(
        "👂 Listening For Emails..."
    );


}






module.exports =
    startListener;