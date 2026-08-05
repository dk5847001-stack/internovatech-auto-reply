const mongoose = require("mongoose");


// Single Message Schema
const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            enum: ["user", "bot"],
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            default: Date.now
        }

    },
    {
        _id: false
    }
);




// Conversation Schema
const conversationSchema = new mongoose.Schema(
    {

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },


        name: {
            type: String,
            default: "Unknown",
            trim: true
        },


        subject: {
            type: String,
            default: ""
        },


        messages: [
            messageSchema
        ],



        totalMessages: {
            type: Number,
            default: 0
        },


        lastMessage: {
            type: String,
            default: ""
        },


        lastReply: {
            type: Date,
            default: null
        },


        isActive: {
            type: Boolean,
            default: true
        },


        createdAt: {
            type: Date,
            default: Date.now
        },


        updatedAt: {
            type: Date,
            default: Date.now
        }


    }
);





// Auto Update Middleware
conversationSchema.pre(
    "save",
    function(){

        this.updatedAt = new Date();



        if(Array.isArray(this.messages)){

            this.totalMessages =
                this.messages.length;



            if(this.messages.length > 0){

                const last =
                    this.messages[
                        this.messages.length - 1
                    ];


                this.lastMessage =
                    last.message;


                if(last.sender === "bot"){

                    this.lastReply =
                        last.date || new Date();

                }

            }

        }


    }
);





// Create Index For Faster Search
conversationSchema.index({
    email:1,
    updatedAt:-1
});





module.exports =
mongoose.model(
    "Conversation",
    conversationSchema
);