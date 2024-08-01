import { Schema, Document, model } from 'mongoose';

export interface subscriptionModel extends Document {
    plan: string; 
    price: number; 
    features: string[]; 
    active: boolean; 
    startDate: Date;
    endDate: Date;
    userId: string;
}

const subscriptionSchema = new Schema({
    plan: { type: String, required: true },
    price: { type: Number, required: true },
    features: [{ type: String }],
    active: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'user', required: true }
});

export default model<subscriptionModel>('Subscription', subscriptionSchema);
