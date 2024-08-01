import { Schema, model, Document, Types } from 'mongoose';

export interface Medication {
  drugName: string;
  dosage: string;
  form: string;
  quantity: number;
  instructions: string;
}

export interface ePrescriptionDocument extends Document {
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  prescriptionData: {
    patientInfo: {
      name: string;
      age: number;
      gender: string;
    };
    doctorInfo: {
      name: string;
      contact: string;
      specialization: string;
    };
    medications: Medication[];
    additionalNotes: string;
  };
  createdAt: Date;
}

const medicationSchema = new Schema<Medication>({
  drugName: { type: String, required: true },
  dosage: { type: String, required: true },
  form: { type: String, required: true },
  quantity: { type: Number, required: true },
  instructions: { type: String, required: true },
});

const ePrescriptionSchema = new Schema<ePrescriptionDocument>({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  prescriptionData: {
    patientInfo: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, required: true },
    },
    doctorInfo: {
      name: { type: String, required: true },
      contact: { type: String, required: true },
      specialization: { type: String, required: true },
    },
    medications: [medicationSchema],
    additionalNotes: { type: String, required: false },
  },
  createdAt: { type: Date, default: Date.now },
});

const ePrescriptionModel = model<ePrescriptionDocument>('ePrescription', ePrescriptionSchema);

export default ePrescriptionModel;
