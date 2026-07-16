const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { OllamaEmbeddings } = require("@langchain/ollama");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { ChatOpenAI } = require("@langchain/openai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const pdfRoutes = require("./routes/pdf");
const conversationRoutes = require("./routes/conversation");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// const embeddings = new OllamaEmbeddings({ model: "nomic-embed-text", baseUrl: "http://127.0.0.1:11434" });
const embeddings =
    process.env.EMBEDDING_PROVIDER === "ollama"
        ? new OllamaEmbeddings({
            model: "nomic-embed-text",
            baseUrl: "http://127.0.0.1:11434",
        })
        : new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "embedding-001",
        });

const model = process.env.LLM_PROVIDER === "ollama"
    ? new ChatOpenAI({ apiKey: "ollama", configuration: { baseURL: "http://127.0.0.1:11434/v1" }, model: process.env.OLLAMA_MODEL || "llama3", temperature: 0.2 })
    : new ChatOpenAI({ apiKey: process.env.OPENROUTER_API_KEY, configuration: { baseURL: "https://openrouter.ai/api/v1" }, model: "openai/gpt-oss-20b:free", temperature: 0.2 });

app.locals.embeddings = embeddings;
app.locals.model = model;

mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("MongoDB Connected");
    const pdfCollection = mongoose.connection.db.collection("pdfembeddings");
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, { collection: pdfCollection, indexName: "vector_index", textKey: "text", embeddingKey: "embedding" });
    app.locals.vectorStore = vectorStore;
}).catch((error) => { console.log("MongoDB connection error:", error); });

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/pdf", pdfRoutes);
app.use("/conversation", conversationRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({ success: false, error: err.message || "Internal server error" });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.listen(5000, () => { console.log("Server Running On Port 5000"); });
