import mongoose from "mongoose";

const connectMongoDb = async (url: string): Promise<void> => {
  try {
    await mongoose.connect(url);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectMongoDb;
