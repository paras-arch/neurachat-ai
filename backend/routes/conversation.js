const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversationController");
const verifyToken = require("../middleware/auth");

router.use(verifyToken);

router.post("/", conversationController.createConversation);
router.patch("/:id", conversationController.updateConversation);
router.patch("/:id/title", conversationController.renameConversation);
router.get("/", conversationController.getConversations);
router.get("/:id/messages", conversationController.getMessages);
router.delete("/messages", conversationController.clearAllMessages);
router.delete("/:id/messages", conversationController.deleteMessages);
router.delete("/:id", conversationController.deleteConversation);

module.exports = router;
