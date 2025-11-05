import mongoose from "mongoose";

const connectMongoDb = async (url: string): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(url);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

export default connectMongoDb;
