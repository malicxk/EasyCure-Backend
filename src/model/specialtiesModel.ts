import mongoose, { Document, Schema } from 'mongoose';

// Define interface for Doctor document
export interface specialtyDocument extends Document {
  specialtyImage: string;
  specialtyName: string;
  isDocAvailable: boolean;
  amount: number;
}

// Define Mongoose schema for Doctor model
const SpecialtySchema = new mongoose.Schema({
  specialtyImage: { type: String },
  specialtyName: { type: String },
  isDocAvailable: { type: Boolean },//admin change the status ,then it will updated
  amount: { type: Number }
});

// Define Doctor model using schema
export const SpecialtyModel = mongoose.model<specialtyDocument>('Specialty', SpecialtySchema);

