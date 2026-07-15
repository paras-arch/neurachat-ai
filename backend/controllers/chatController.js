const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { message, selectedPdfs, conversationId } = req.body;
    const userId = req.user.id;

    if (!message && !selectedPdfs?.length) {
        return next(new AppError("Message is required.", 400));
    }

    // Access vectorStore and model from app locals (set in server.js)
    const vectorStore = req.app.locals.vectorStore;
    const model = req.app.locals.model;

    if (!vectorStore) {
        return res.status(503).json({
            success: false,
            error: "Vector store not initialized. Is MongoDB connected and Ollama running?",
        });
    }

    let context = "";
    let historyContext = "";

    // Fetch conversation history
    if (conversationId) {
        try {
            const prior = await Message.find({ conversationId, userId })
                .sort({ createdAt: -1 })
                .limit(6);
            if (prior.length > 0) {
                historyContext = prior
                    .reverse()
                    .map((m) => `User: ${m.userMessage}\nNeuraChat: ${m.aiReply}`)
                    .join("\n");
            }
        } catch (e) {
            console.log("History fetch failed:", e.message);
        }
    }

    // Multi-PDF retrieval
    if (Array.isArray(selectedPdfs) && selectedPdfs.length > 0) {
        const perPdfK = 8;
        const scoreThreshold = 1.2;
        const hardCap = 40;
        let allChunks = [];
        const bestPerPdf = {};

        const queries = [message];
        if (historyContext) {
            let truncatedHistory = historyContext;
            if (truncatedHistory.length > 1500) {
                truncatedHistory = truncatedHistory.slice(-1500);
            }
            queries.push(`${message}\n${truncatedHistory}`);
        }

        for (const pdfName of selectedPdfs) {
            try {
                for (const q of queries) {
                    const scored = await vectorStore.similaritySearchWithScore(q, perPdfK, {
                        preFilter: { fileName: { $in: [pdfName] } },
                    });
                    scored.forEach(([doc, score]) => {
                        if (score <= scoreThreshold) {
                            const key = doc.pageContent;
                            if (!allChunks.some((c) => c.content === key)) {
                                const chunk = {
                                    fileName: doc.metadata.fileName || pdfName,
                                    page: doc.metadata.page,
                                    content: doc.pageContent,
                                    score,
                                };
                                allChunks.push(chunk);
                                const f = chunk.fileName;
                                if (!bestPerPdf[f] || chunk.score < bestPerPdf[f].score) {
                                    bestPerPdf[f] = chunk;
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.log("Retrieval failed for", pdfName, e.message);
            }
        }

        allChunks.sort((a, b) => a.score - b.score);
        const guaranteed = Object.values(bestPerPdf);
        let trimmed = allChunks.slice(0, hardCap);
        for (const g of guaranteed) {
            if (!trimmed.some((c) => c.content === g.content)) {
                trimmed.push(g);
            }
        }
        trimmed.sort((a, b) => a.score - b.score);
        allChunks = trimmed;

        if (allChunks.length > 0) {
            context = allChunks
                .map((c) => `--- SOURCE: ${c.fileName} (Page: ${c.page}) ---\n${c.content}`)
                .join("\n\n");
        }
    }

    const hasContext = context && context.trim().length > 0;

    const contextBlock = hasContext
        ? `
You are NeuraChat AI, an intelligent RAG assistant.

Below is the retrieved content from the user's selected documents. Use ONLY this content to answer, and cite the source as (Source: filename, Page: n).

=== RETRIEVED DOCUMENT CONTEXT ===
${context}
=== END CONTEXT ===

${historyContext ? `Earlier conversation (use this to resolve references like "his", "that subject", "web tech", or a person's name):\n${historyContext}\n` : ""}

RULES:
1. Answer the question using the retrieved context above. The answer IS present in the context — read it carefully before concluding otherwise.
2. If the question uses a vague reference (e.g. "his skills", "web tech subject"), resolve it using the earlier conversation AND the retrieved context together.
3. Only if the answer is genuinely absent from BOTH the context and the history, reply exactly: "I couldn't find that information in the uploaded document."
4. Always cite the source like (Source: filename, Page: n) when using document context.
5. Keep answers clean, complete, and well formatted. Do not truncate lists or items present in the context.

FORMATTING RULES:
- Use **tables** for comparisons, schedules, or structured data
- Use **numbered lists** for steps, sequences, or ordered items
- Use **bullet points** for lists of items, features, or attributes
- Use **bold** for key terms, subject names, and important values
- Use **headings** (###) to organize long answers into sections
- Use blank lines between sections for readability
`
        : `
You are NeuraChat AI, a helpful conversational assistant.

No documents are currently selected, so answer using general knowledge and the conversation history.
Remember details the user shares (such as their name) and use them in later turns.
Keep answers clean, short and well formatted.
`;

    let result;
    let lastErr;
    for (let attempt = 0; attempt < 4; attempt++) {
        try {
            result = await model.invoke([
                new SystemMessage(contextBlock),
                new HumanMessage(message),
            ]);
            break;
        } catch (err) {
            lastErr = err;
            const isRateLimit = err && (err.status === 429 || err.code === 429 || /rate.?limit/i.test(String(err.message)));
            if (!isRateLimit) throw err;
            const waitMs = 2000 * Math.pow(2, attempt);
            console.log(`Rate limited, retry ${attempt + 1}/4 in ${waitMs}ms`);
            await new Promise((r) => setTimeout(r, waitMs));
        }
    }
    if (!result) throw lastErr;

    const reply = typeof result.content === "string"
        ? result.content
        : (result.content && result.content[0] && result.content[0].text) || "";

    if (conversationId) {
        await Message.create({
            conversationId,
            userId,
            userMessage: message,
            aiReply: reply,
        });
    }

    res.json({ success: true, reply });
});
