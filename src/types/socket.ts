export interface ServerToClientEvents {
  'new-message': (data: {
    chatId: string;
    message: {
      sender: {
        _id: string;
        username: string;
      };
      content: string;
      timestamp: Date;
    };
  }) => void;
  
  'user-typing': (data: {
    userId: string;
    username: string;
    isTyping: boolean;
  }) => void;
  
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-chats': () => void;
  
  'send-message': (data: {
    chatId: string;
    content: string;
  }) => void;
  
  'typing': (data: {
    chatId: string;
    isTyping: boolean;
  }) => void;
}

export interface SocketData {
  user: {
    _id: string;
    username: string;
    email?: string;
  };
}