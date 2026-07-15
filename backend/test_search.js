const mongoose = require("mongoose");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { OllamaEmbeddings } = require("@langchain/ollama");
require("dotenv").config();

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB using Mongoose");
        const connection = mongoose.connection;
        const pdfCollection = connection.db.collection("pdfembeddings");

        const embeddings = new OllamaEmbeddings({
            model: "nomic-embed-text",
            baseUrl: "http://127.0.0.1:11434",
        });

        const vectorStore = new MongoDBAtlasVectorSearch(
            embeddings,
            {
                collection: pdfCollection,
                indexName: "vector_index",
                textKey: "text",
                embeddingKey: "embedding",
            }
        );

        // Get distinct file names
        const distinctFiles = await pdfCollection.distinct("fileName");
        console.log("Distinct files in database:", distinctFiles);

        if (distinctFiles.length === 0) {
            console.log("No files in collection.");
            return;
        }

        const query = "What is the candidate's name or education?";

        // Case 1: Search with 1 PDF
        const onePdf = [distinctFiles[0]];
        console.log(`\nSearching with 1 PDF: ${JSON.stringify(onePdf)}`);
        const resultsOne = await vectorStore.similaritySearch(
            query,
            5,
            {
                preFilter: {
                    fileName: {
                        $in: onePdf,
                    },
                },
            }
        );
        console.log("Results found:", resultsOne.length);
        resultsOne.forEach((doc, i) => {
            console.log(`[Doc ${i+1}] File: ${doc.metadata.fileName}, Page: ${doc.metadata.page}`);
            console.log(`Content snippet: ${doc.pageContent.substring(0, 150)}...`);
        });

        // Case 2: Search with 2 PDFs (if we have at least 2)
        if (distinctFiles.length >= 2) {
            const twoPdfs = [distinctFiles[0], distinctFiles[1]];
            console.log(`\nSearching with 2 PDFs: ${JSON.stringify(twoPdfs)}`);
            const resultsTwo = await vectorStore.similaritySearch(
                query,
                5,
                {
                    preFilter: {
                        fileName: {
                            $in: twoPdfs,
                        },
                    },
                }
            );
            console.log("Results found:", resultsTwo.length);
            resultsTwo.forEach((doc, i) => {
                console.log(`[Doc ${i+1}] File: ${doc.metadata.fileName}, Page: ${doc.metadata.page}`);
                console.log(`Content snippet: ${doc.pageContent.substring(0, 150)}...`);
            });
        } else {
            console.log("\nNot enough distinct PDFs to test 2 PDFs search.");
        }

    } catch (err) {
        console.error("Search failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
