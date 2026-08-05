const mongoose = require("mongoose");


const emailSchema = new mongoose.Schema({

    uid:{
        type:Number,
        unique:true
    },

    sender:{
        type:String,
        required:true
    },

    senderName:{
        type:String
    },

    subject:{
        type:String
    },

    message:{
        type:String
    },

    replySent:{
        type:Boolean,
        default:false
    },

    reply:{
        type:String
    },

    receivedAt:{
        type:Date,
        default:Date.now
    }

});


module.exports = mongoose.model(
    "Email",
    emailSchema
);