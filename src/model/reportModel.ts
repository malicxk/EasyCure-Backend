import mongoose, { Document, Schema } from 'mongoose';

export interface reportDocument extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  reporterRole: 'patient' | 'doctor';
  reportedUserRole: 'patient' | 'doctor';
  reason: string;
  comments?: string;
  status: boolean;
  createdAt: Date;
}

const reportSchema: Schema<reportDocument> = new Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reporterRole: { type: String, enum: ['patient', 'doctor'], required: true },
  reportedUserRole: { type: String, enum: ['patient', 'doctor'], required: true },
  reason: { type: String, required: true },
  comments: { type: String },
  status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ReportModel = mongoose.model<reportDocument>('ReportModel', reportSchema);
export default ReportModel;