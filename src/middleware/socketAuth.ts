import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import UserModel from '../model/user';

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};