async function run() {
    try {
        console.log("Creating conversation...");
        const convRes = await fetch("http://localhost:5000/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedPdfs: ["5th sem.pdf"] })
        });
        const convData = await convRes.json();
        const conversationId = convData.conversationId;
        console.log("Created conversation with ID:", conversationId);

        console.log("\nTesting chat with 1 PDF...");
        const chatRes1 = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "What subjects are in the 5th semester?",
                selectedPdfs: ["5th sem.pdf"],
                conversationId: conversationId
            })
        });
        const chatData1 = await chatRes1.json();
        console.log("Chat response 1 status:", chatRes1.status);
        console.log("Chat response 1 data:", chatData1);

        console.log("\nTesting chat with 2 PDFs...");
        const chatRes2 = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "What subjects are in the 5th semester?",
                selectedPdfs: ["5th sem.pdf", "Vansh Saxena.pdf"],
                conversationId: conversationId
            })
        });
        const chatData2 = await chatRes2.json();
        console.log("Chat response 2 status:", chatRes2.status);
        console.log("Chat response 2 data:", chatData2);

    } catch (error) {
        console.error("Request failed:", error.message);
    }
}

run();
