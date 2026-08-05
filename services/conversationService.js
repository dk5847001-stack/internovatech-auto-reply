const Conversation = require("../models/Conversation");



// Find Existing Conversation

async function getConversation(email){

    try{

        const conversation =
        await Conversation.findOne({
            email:email.toLowerCase()
        });


        return conversation;


    }catch(error){

        console.log(
            "Conversation Fetch Error:",
            error.message
        );

        return null;

    }

}




// Create Or Update Conversation

async function saveConversation(
    {
        email,
        name,
        subject,
        userMessage,
        botReply
    }
){


    try{


        let conversation =
        await Conversation.findOne({
            email:email.toLowerCase()
        });



        if(!conversation){


            conversation =
            new Conversation({

                email:
                email.toLowerCase(),

                name:
                name || "Unknown",

                subject:
                subject || ""

            });


        }



        // User Message

        conversation.messages.push({

            sender:"user",

            message:userMessage

        });



        // Bot Reply

        conversation.messages.push({

            sender:"bot",

            message:botReply

        });



        await conversation.save();



        return conversation;



    }catch(error){


        console.log(
            "Conversation Save Error:",
            error.message
        );


        return null;

    }


}





module.exports={
    getConversation,
    saveConversation
};