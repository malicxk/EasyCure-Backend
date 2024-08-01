import mongoose, { Document, Schema } from 'mongoose';
//interface defining
export interface ConsultationSlotDocument extends Document {
  doctorId: mongoose.Schema.Types.ObjectId;
  slotId: mongoose.Schema.Types.ObjectId;
  date: Date;
  startTime: string;
  isAvailable: boolean;
  isBooked: boolean;
  consultationMethod: string;
  isDefault: boolean;
}

// Define Mongoose schema for ConsultationSlot model
const ConsultationSlotSchema = new Schema<ConsultationSlotDocument>({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  slotId: { type: Schema.Types.ObjectId },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  isAvailable: { type: Boolean },
  isBooked: { type: Boolean, default: false },
  consultationMethod: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

export const ConsultationSlotModel = mongoose.model<ConsultationSlotDocument>('ConsultationSlot', ConsultationSlotSchema);

