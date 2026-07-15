const PdfEmbedding = require("../models/PdfEmbedding");
const asyncHandler = require("../utils/asyncHandler");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const fs = require("fs");

exports.uploadPdf = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new AppError("No PDF file provided.", 400));
    }

    const userId = req.user.id;
    const embeddings = req.app.locals.embeddings;

    const existingPdf = await PdfEmbedding.findOne({
        fileName: req.file.originalname,
        userId,
    });

    if (existingPdf) {
        return res.json({
            success: true,
            indexed: false,
            message: "PDF already exists in the knowledge base.",
        });
    }

    const loader = new PDFLoader(req.file.path);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    const vectors = await embeddings.embedDocuments(
        splitDocs.map((doc) => doc.pageContent)
    );

    for (let i = 0; i < splitDocs.length; i++) {
        await PdfEmbedding.create({
            text: splitDocs[i].pageContent,
            embedding: vectors[i],
            page: splitDocs[i].metadata.loc.pageNumber,
            fileName: req.file.originalname,
            userId,
        });
    }

    res.json({ success: true, file: req.file });
});

exports.getPdfs = asyncHandler(async (req, res) => {
    const pdfs = await PdfEmbedding.distinct("fileName", { userId: req.user.id });
    res.json({ success: true, pdfs });
});

exports.deletePdf = asyncHandler(async (req, res, next) => {
    const fileName = req.params.fileName;
    const userId = req.user.id;

    const result = await PdfEmbedding.deleteMany({ fileName, userId });

    // Delete the file from uploads folder
    const uploadDir = "uploads/";
    const files = fs.readdirSync(uploadDir).filter((f) => f.includes(fileName));
    files.forEach((f) => {
        try { fs.unlinkSync(uploadDir + f); } catch (e) { }
    });

    res.json({ success: true, deletedCount: result.deletedCount });
});
