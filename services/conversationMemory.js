const Conversation = require("../models/Conversation");


// Get previous conversation

async function getConversation(email){

    try{

        const conversation = await Conversation.findOne({
            email: email.toLowerCase()
        });


        return conversation;


    }
    catch(error){

        console.log(
            "Memory Fetch Error:",
            error.message
        );

        return null;

    }

}




// Save user message

async function saveUserMessage(
    email,
    name,
    subject,
    message
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

                name:name || "Unknown",

                subject

            });


        }



        conversation.messages.push({

            sender:"user",

            message

        });



        await conversation.save();



        console.log(
            "💾 User message saved"
        );



        return conversation;



    }
    catch(error){


        console.log(
            "Save User Error:",
            error.message
        );


    }


}





// Save bot reply


async function saveBotReply(
    email,
    reply
){


try{


let conversation =
await Conversation.findOne({

email:
email.toLowerCase()

});



if(!conversation){

return;

}



conversation.messages.push({

sender:"bot",

message:reply

});


conversation.lastReply =
new Date();



await conversation.save();



console.log(
"💾 Bot reply saved"
);



}
catch(error){


console.log(
"Save Bot Error:",
error.message
);


}


}





module.exports={

getConversation,

saveUserMessage,

saveBotReply

};