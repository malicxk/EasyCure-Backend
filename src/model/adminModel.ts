import mongoose, { Schema, Document } from 'mongoose';

export interface AdminDocument extends Document {
  email: string;
  password: string;
}


const adminSchema : Schema<AdminDocument>=new Schema({
  email: { type: String, unique: true },
  password: { type: String},
});

export const AdminModel = mongoose.model<AdminDocument>('admin', adminSchema);
