import { Router } from "express";

const router = Router();
import {
  createChat,
  getChatsForUser,
  getChatMessages,
} from "../controller/chat";
import {
  updateGroupName,
  addGroupMember,
  removeGroupMember,
} from "../controller/group";
import { authenticateToken } from "../middleware/auth";

router.post("/chats", authenticateToken, createChat);
router.get("/chats", authenticateToken, getChatsForUser);
router.get("/chats/:chatId/messages", authenticateToken, getChatMessages);

// Group management routes
router.put("/chats/:chatId/group-name", authenticateToken, updateGroupName);
router.post("/chats/:chatId/members", authenticateToken, addGroupMember);
router.delete("/chats/:chatId/members", authenticateToken, removeGroupMember);

export default router;
