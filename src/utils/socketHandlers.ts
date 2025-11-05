import { Server, Socket } from 'socket.io';
import ChatModel from '../model/chat';
import { IUser, IMessage } from '../types';

interface SendMessageData {
  chatId: string;
  content: string;
}

interface TypingData {
  chatId: string;
  isTyping: boolean;
}

interface MessageResponse {
  chatId: string;
  message: {
    _id?: string;
    sender: {
      _id: string;
      username: string;
    };
    content: string;
    timestamp: Date;
  };
}

export const handleSocketConnection = (io: Server, socket: Socket): void => {
  const user = socket.data.user as IUser;

  socket.join(user._id.toString());

  socket.on('join-chats', async (): Promise<void> => {
    try {
      const chats = await ChatModel.find({ participants: user._id })
        .select('_id')
        .lean()
        .exec();
        
      chats.forEach(chat => {
        socket.join(chat._id.toString());
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join chats' });
    }
  });

  socket.on('send-message', async (data: SendMessageData): Promise<void> => {
    try {
      const { chatId, content } = data;
      
      if (!content?.trim() || !chatId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      const chat = await ChatModel.findById(chatId)
        .select('participants messages')
        .exec();
        
      if (!chat || !chat.participants.some(p => p.toString() === user._id.toString())) {
        socket.emit('error', { message: 'Unauthorized or chat not found' });
        return;
      }

      const message: IMessage = {
        sender: user._id,
        content: content.trim(),
        timestamp: new Date()
      };

      chat.messages.push(message);
      await chat.save();

      const messageResponse: MessageResponse = {
        chatId,
        message: {
          sender: {
            _id: user._id.toString(),
            username: user.username
          },
          content: message.content,
          timestamp: message.timestamp
        }
      };

      io.to(chatId).emit('new-message', messageResponse);

    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data: TypingData): void => {
    const { chatId, isTyping } = data;
    
    if (!chatId) return;
    
    socket.to(chatId).emit('user-typing', {
      userId: user._id.toString(),
      username: user.username,
      isTyping
    });
  });

  socket.on('disconnect', (): void => {
    // Clean disconnection
  });
};