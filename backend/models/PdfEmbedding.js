const mongoose = require("mongoose");

const pdfEmbeddingSchema = new mongoose.Schema(
    {


        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },



        text: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            required: true,
        },
        page: {
            type: Number,
        },
        fileName: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },

    }
);

module.exports = mongoose.model(
    "PdfEmbedding", pdfEmbeddingSchema
);