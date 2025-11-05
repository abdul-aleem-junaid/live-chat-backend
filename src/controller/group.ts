import { Response } from 'express';
import { Types } from 'mongoose';
import ChatModel from '../model/chat';
import { AuthRequest } from '../types';

interface UpdateGroupNameRequest {
  groupName: string;
}

interface GroupMemberRequest {
  userId: string;
}

const isGroupAdmin = (chat: any, userId: Types.ObjectId): boolean => {
  return chat?.isGroup && chat?.groupAdmin?.toString() === userId.toString();
};

export const updateGroupName = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { groupName }: UpdateGroupNameRequest = req.body;
    const userId = req.user?._id;

    if (!userId || !groupName?.trim()) {
      res.status(400).json({ message: 'Invalid request data' });
      return;
    }

    const chat = await ChatModel.findById(chatId).exec();
    
    if (!chat || !isGroupAdmin(chat, userId)) {
      res.status(403).json({ message: 'Unauthorized or not a group admin' });
      return;
    }

    await ChatModel.findByIdAndUpdate(
      chatId,
      { groupName: groupName.trim() },
      { new: true }
    );

    res.status(200).json({ message: 'Group name updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addGroupMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { userId: newMemberId }: GroupMemberRequest = req.body;
    const userId = req.user?._id;

    if (!userId || !newMemberId) {
      res.status(400).json({ message: 'Invalid request data' });
      return;
    }

    const chat = await ChatModel.findById(chatId).exec();
    
    if (!chat || !isGroupAdmin(chat, userId)) {
      res.status(403).json({ message: 'Unauthorized or not a group admin' });
      return;
    }

    const memberExists = chat.participants.some(
      p => p.toString() === newMemberId
    );

    if (!memberExists) {
      await ChatModel.findByIdAndUpdate(
        chatId,
        { $push: { participants: new Types.ObjectId(newMemberId) } }
      );
    }

    res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeGroupMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.params;
    const { userId: memberId }: GroupMemberRequest = req.body;
    const userId = req.user?._id;

    if (!userId || !memberId) {
      res.status(400).json({ message: 'Invalid request data' });
      return;
    }

    const chat = await ChatModel.findById(chatId).exec();
    
    if (!chat || !isGroupAdmin(chat, userId)) {
      res.status(403).json({ message: 'Unauthorized or not a group admin' });
      return;
    }

    await ChatModel.findByIdAndUpdate(
      chatId,
      { $pull: { participants: new Types.ObjectId(memberId) } }
    );

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};