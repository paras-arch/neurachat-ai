const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({


    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    title: {
        type: String,
        default: "New Chat",
    },

    selectedPdfs: [
        {
            type: String,
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    }

});

module.exports = mongoose.model(
    "Conversation",
    conversationSchema
);