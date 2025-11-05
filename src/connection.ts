import mongoose from "mongoose";

const connectMongoDb = async (url: string): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI (first 20 chars):', url.substring(0, 20));
    
    if (!url || url === 'undefined' || !url.startsWith('mongodb')) {
      throw new Error('Invalid MongoDB URI provided');
    }
    
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.error('MongoDB URI length:', url?.length || 'undefined');
    throw error;
  }
};

export default connectMongoDb;
