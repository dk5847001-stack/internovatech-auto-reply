const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");


const Email = require("../models/Email");


const replyEngine = require("./replyEngine");
const sendMail = require("./mailSender");


const {
    getConversation,
    saveConversation
} = require("./conversationService");





const client = new ImapFlow({

    host: process.env.IMAP_HOST,

    port: Number(process.env.IMAP_PORT),

    secure:true,


    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }

});








async function processEmail(uid){


    try{


        const message =
        await client.fetchOne(
            uid,
            {
                source:true
            }
        );



        const parsed =
        await simpleParser(
            message.source
        );



        const from =
        parsed.from.value[0];



        const senderEmail =
        from.address
        .toLowerCase()
        .trim();



        const senderName =
        from.name || "Unknown";



        const subject =
        parsed.subject || "";



        const text =
        parsed.text || "";




        console.log("\n📩 New Email");

        console.log(
            "From:",
            senderEmail
        );


        console.log(
            "Subject:",
            subject
        );


        console.log(
            "Message:",
            text
        );






        // Duplicate Protection

        const already =
        await Email.findOne({
            uid
        });



        if(already){


            console.log(
                "⚠️ Email already processed"
            );


            return;

        }







        await Email.create({

            uid,

            sender:
            senderEmail,

            senderName,

            subject,

            message:text

        });









        // Fetch Conversation Memory


        const conversation =
        await getConversation(
            senderEmail
        );



        let history=[];



        if(conversation){


            history =
            conversation.messages;


            console.log(
                "🧠 Previous Conversation Found:",
                history.length,
                "messages"
            );


        }
        else{


            console.log(
                "🆕 New User Conversation"
            );


        }









        // Generate Smart Reply


        const reply =
        await replyEngine({

            name:
            senderName,

            email:
            senderEmail,

            subject,

            message:
            text,

            history

        });



        const replySubject =
        reply && typeof reply === "object" && reply.subject
        ?
        reply.subject
        :
        "Re: " + subject;



        const replyMessage =
        reply && typeof reply === "object" && reply.message
        ?
        reply.message
        :
        String(reply || "");









        // Send Email Reply


        await sendMail({

            to:
            senderEmail,


            subject:
            replySubject,


            text:
            replyMessage

        });





        console.log(
            "📤 Reply Email Sent"
        );









        // Save Conversation Memory


        await saveConversation({

            email:
            senderEmail,


            name:
            senderName,


            subject,


            userMessage:
            text,


            botReply:
            replyMessage

        });





        console.log(
            "💾 Conversation Saved"
        );









        await Email.updateOne(

            {
                uid
            },

            {

                replySent:true,

                reply:
                replyMessage

            }

        );





        console.log(
            "✅ Processing Completed"
        );



    }



    catch(error){


        console.error(
            "❌ Email Processing Error:",
            error.message
        );


    }


}









async function startMailListener(){


    try{


        await client.connect();



        console.log(
            "✅ Connected to Zoho IMAP"
        );





        await client.mailboxOpen(
            "INBOX"
        );





        console.log(
            "📩 Listening for new emails..."
        );






        client.on(
            "exists",
            async()=>{


                console.log(
                    "📨 New Email Received!"
                );



                const lock =
                await client.getMailboxLock(
                    "INBOX"
                );



                try{


                    const status =
                    await client.status(
                        "INBOX",
                        {
                            messages:true
                        }
                    );



                    const uid =
                    status.messages;




                    await processEmail(
                        uid
                    );



                }


                finally{


                    lock.release();


                }



            }
        );



    }



    catch(error){


        console.error(
            "IMAP Listener Error:",
            error.message
        );


    }


}






module.exports =
startMailListener;
