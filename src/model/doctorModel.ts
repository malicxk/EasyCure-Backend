import mongoose, { Document } from 'mongoose';

// Define interface for Doctor document
export interface DoctorDocument extends Document {
  doctorname: string;
  email: string;
  password: string;
  dateOfbirth: string;
  specialty: string;
  description: string;
  workExperience: string,
  profilePhoto: string;
  certificates: string[];
  isBlocked: boolean;
  isVerified: boolean, default: false;
  feedback: {
    userId: mongoose.Schema.Types.ObjectId;
    comment: string;
    rating: number;
    date: Date;
  }[];
}

// Define Mongoose schema for Doctor model
const DoctorSchema = new mongoose.Schema({
  doctorname: { type: String },
  email: { type: String },
  password: { type: String },
  name: { type: String },
  dateOfbirth: { type: String },
  specialty: { type: String },
  description: { type: String },
  workExperience: { type: String },
  profilePhoto: { type: String },
  certificates: { type: [String] },
  isBlocked: { type: Boolean },
  isVerified: { type: Boolean, default: false },
});

// Define Doctor model using schema
export const DoctorModel = mongoose.model<DoctorDocument>('Doctor', DoctorSchema);

