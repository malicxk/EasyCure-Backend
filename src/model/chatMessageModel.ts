import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message?: string;
  timestamp: Date;
  isBooked: boolean;
}

const ChatMessageSchema: Schema = new Schema({
  senderId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  receiverId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isBooked: { type: Boolean, default: false }
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
