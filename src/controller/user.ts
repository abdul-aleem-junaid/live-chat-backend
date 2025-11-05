import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import UserModel from '../model/user';
import { generateToken } from '../utils/jwt';
import { LoginResponse, SignupResponse, AuthRequest } from '../types';

interface SignupRequest {
  username: string;
  email?: string;
  password: string;
}

interface SigninRequest {
  email: string;
  password: string;
}

interface UserQuery {
  search?: string;
}

export const validateSignup = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const validateSignin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const handleSignIn = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
      return;
    }

    const { email, password }: SigninRequest = req.body;

    // Allow login with either email or username
    const foundUser = await UserModel.findOne({
      $or: [{ email }, { username: email }]
    }).select('+password').exec();
      
    if (!foundUser) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await foundUser.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(foundUser);

    const response: LoginResponse = {
      message: 'Sign in successful',
      token,
      user: {
        id: foundUser._id.toString(),
        username: foundUser.username,
        email: foundUser.email
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
      return;
    }

    const { username, password, email }: SignupRequest = req.body;

    const duplicateQuery = email 
      ? { $or: [{ username }, { email }] }
      : { username };
      
    const duplicate = await UserModel.findOne(duplicateQuery).exec();

    if (duplicate) {
      const message = duplicate.username === username 
        ? 'Username already exists' 
        : 'Email already exists';
      res.status(409).json({ message });
      return;
    }

    const userData = {
      username,
      password,
      ...(email && { email })
    };

    const newUser = await UserModel.create(userData);

    const response: SignupResponse = {
      success: `User ${username} created successfully`,
      user: {
        id: newUser._id.toString(),
        username: newUser.username
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { search }: UserQuery = req.query;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const filter = {
      _id: { $ne: userId },
      ...(search && { 
        username: { 
          $regex: search.trim(), 
          $options: 'i' 
        } 
      })
    };

    const users = await UserModel.find(filter)
      .select('username email')
      .limit(50)
      .lean()
      .exec();

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
