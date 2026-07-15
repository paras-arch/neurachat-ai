const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

exports.createConversation = asyncHandler(async (req, res) => {
    const { selectedPdfs } = req.body;
    const conversation = await Conversation.create({
        title: "New Chat",
        selectedPdfs: selectedPdfs || [],
        userId: req.user.id,
    });
    res.json({ success: true, conversationId: conversation._id });
});

exports.updateConversation = asyncHandler(async (req, res, next) => {
    const { selectedPdfs } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { selectedPdfs: selectedPdfs || [] },
        { returnDocument: "after" }
    );
    if (!conversation) {
        return next(new AppError("Conversation not found", 404));
    }
    res.json({ success: true, conversationId: conversation._id, selectedPdfs: conversation.selectedPdfs });
});

exports.renameConversation = asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    const conversation = await Conversation.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { title },
        { returnDocument: "after" }
    );
    if (!conversation) {
        return next(new AppError("Conversation not found", 404));
    }
    res.json({ success: true, conversation });
});

exports.getConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .select("_id title selectedPdfs createdAt");
    res.json({ success: true, conversations });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
    const messages = await Message.find({
        conversationId: req.params.id,
        userId: req.user.id,
    }).sort({ createdAt: 1 });

    const formatted = [];
    messages.forEach((m) => {
        formatted.push({ role: "user", text: m.userMessage });
        formatted.push({ role: "ai", text: m.aiReply });
    });
    res.json({ success: true, messages: formatted });
});

exports.deleteMessages = asyncHandler(async (req, res) => {
    await Message.deleteMany({
        conversationId: req.params.id,
        userId: req.user.id,
    });
    res.json({ success: true, message: "Conversation chats deleted" });
});

exports.clearAllMessages = asyncHandler(async (req, res) => {
    await Message.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: "All chats deleted" });
});

exports.deleteConversation = asyncHandler(async (req, res, next) => {
    const conversation = await Conversation.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id,
    });
    if (!conversation) {
        return next(new AppError("Conversation not found", 404));
    }
    await Message.deleteMany({ conversationId: req.params.id, userId: req.user.id });
    res.json({ success: true, message: "Conversation deleted" });
});
