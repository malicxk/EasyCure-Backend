import { Schema, model, Document, Types } from 'mongoose';

// Define the payBookSlotDocument interface extending from Mongoose's Document
export interface payBookSlotDocument extends Document {
  paymentid: string;
  amount: number;
  userId: Types.ObjectId;
  slotId: string;
  specialtyId: Types.ObjectId;
  doctorId: Types.ObjectId;
  payBookDate: Date;
  startTime: string
  consultationStatus: boolean;
  consultationMethod: string;
  bookingStatus: boolean;
  cancelledBy?: string;
}

// Create a Mongoose schema corresponding to the payBookSlotDocument interface
const PayBookSlotSchema = new Schema<payBookSlotDocument>({
  paymentid: { type: String, required: true },
  amount: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  slotId: { type: String, required: true },
  specialtyId: { type: Schema.Types.ObjectId, ref: 'Specialty', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  payBookDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  consultationStatus: { type: Boolean, required: true },
  consultationMethod: { type: String, required: true },
  bookingStatus: { type: Boolean, default: true, required: true },
  cancelledBy: { type: String },
});

// Create and export the Mongoose model
const payBookSlotModel = model<payBookSlotDocument>('payBookSlotModel', PayBookSlotSchema);

export default payBookSlotModel;

