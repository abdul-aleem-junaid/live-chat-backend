import mongoose from "mongoose";

const connectMongoDb = async (url: string): Promise<void> => {
  try {
    await mongoose.connect(url);
  } catch (error) {
    process.exit(1);
  }
};

export default connectMongoDb;
