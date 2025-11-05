import { Schema, model } from "mongoose";
import { IChat } from "../types";

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model<IChat>("Chat", ChatSchema);
