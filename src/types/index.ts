import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email?: string;
  password: string;
  profilePicture?: string;
  validatePassword(inputPassword: string): Promise<boolean>;
}

export interface IMessage {
  sender: Types.ObjectId;
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupAdmin?: Types.ObjectId;
  messages: IMessage[];
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
  };
}

export interface SignupResponse {
  success: string;
  user: {
    id: string;
    username: string;
  };
}

export interface JwtPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}