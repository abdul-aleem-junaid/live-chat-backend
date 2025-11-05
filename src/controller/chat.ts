import { Response } from "express";
import { Types } from "mongoose";
import ChatModel from "../model/chat";
import { AuthRequest, IChat } from "../types";

interface CreateChatRequest {
  participants: string[];
  isGroup?: boolean;
  groupName?: string;
}

interface PaginationQuery {
  page?: string;
  limit?: string;
}

export const createChat = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { participants, isGroup, groupName }: CreateChatRequest = req.body;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const allParticipants = participants.includes(currentUserId.toString())
      ? participants
      : [...participants, currentUserId.toString()];

    const chatData = {
      participants: allParticipants.map((id) => new Types.ObjectId(id)),
      messages: [],
      ...(isGroup && {
        isGroup: true,
        groupName,
        groupAdmin: currentUserId,
      }),
    };

    const newChat = new ChatModel(chatData);
    const savedChat = await newChat.save();

    const populatedChat = await ChatModel.findById(savedChat._id)
      .populate("participants", "-password -salt")
      .populate("groupAdmin", "username")
      .lean()
      .exec();

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatsForUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const chats = await ChatModel.find({ participants: userId })
      .populate("participants", "-password -salt")
      .populate("groupAdmin", "username")
      .populate("messages.sender", "username")
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const chatsWithLastMessage = chats.map((chat) => ({
      ...chat,
      lastMessage:
        chat.messages && chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null,
      messages: undefined,
    }));

    res.status(200).json(chatsWithLastMessage);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?._id;
    const { page = "1", limit = "20" }: PaginationQuery = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const chat = await ChatModel.findById(chatId)
      .select("participants messages")
      .populate("messages.sender", "username")
      .lean()
      .exec();

    if (
      !chat ||
      !chat.participants.some((p) => p.toString() === userId.toString())
    ) {
      res.status(404).json({ message: "Chat not found or unauthorized" });
      return;
    }

    const totalMessages = chat.messages?.length || 0;
    const skip = (pageNum - 1) * limitNum;
    const startIndex = Math.max(0, totalMessages - skip - limitNum);
    const endIndex = totalMessages - skip;

    const messages = chat.messages?.slice(startIndex, endIndex) || [];
    const hasMore = startIndex > 0;
    const totalPages = Math.ceil(totalMessages / limitNum);

    res.status(200).json({
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalMessages,
        totalPages,
        hasMore,
        hasPrevious: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
