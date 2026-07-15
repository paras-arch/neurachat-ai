const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB using Mongoose");
        const connection = mongoose.connection;
        
        // List collections
        const collections = await connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const collection = connection.db.collection("pdfembeddings");
        
        // Document count
        const count = await collection.countDocuments();
        console.log("Document count in pdfembeddings:", count);

        // Sample document
        if (count > 0) {
            const sample = await collection.findOne();
            console.log("Sample document keys:", Object.keys(sample));
            console.log("Sample document fileName:", sample.fileName);
            console.log("Sample document page:", sample.page);
            console.log("Sample document text length:", sample.text ? sample.text.length : 0);
            console.log("Sample document embedding length:", sample.embedding ? sample.embedding.length : 0);
        }

        // List search indexes
        try {
            const searchIndexes = await collection.listSearchIndexes().toArray();
            console.log("Search Indexes:", JSON.stringify(searchIndexes, null, 2));
        } catch (e) {
            console.log("Failed to list search indexes:", e.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

main();
