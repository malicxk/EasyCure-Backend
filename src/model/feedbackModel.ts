import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the Feedback interface
export interface Feedback extends Document {
    userId: Types.ObjectId;
    doctorId: Types.ObjectId;
    comment: string;
    rating: number;
    date?: Date;
}

// Define the Mongoose schema
const feedbackSchema = new Schema<Feedback>({
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    comment: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
});

// Create and export the Mongoose model
const FeedbackModel = mongoose.model<Feedback>('Feedback', feedbackSchema);
export default FeedbackModel;
