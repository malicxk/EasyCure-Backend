import mongoose, { Schema, Document } from "mongoose";


export interface WalletHistory {
    amount: number;
    date: Date;
    description: string;
}

export interface UserDocument extends Document {
    username: string,
    email: string,
    password: string,
    dateOfbirth: Date,
    isBlocked: boolean,
    profilePhoto: string;
    medCertificate: string;
    walletMoney: number;
    walletHistory: WalletHistory[];
    // _id?:string
}

const UserSchema: Schema<UserDocument> = new Schema({
    username: { type: String },
    email: { type: String },
    password: { type: String },
    dateOfbirth: { type: Date },
    isBlocked: { type: Boolean },
    profilePhoto: { type: String },
    medCertificate: { type: String },
    walletMoney: { type: Number, default: 0 },
    walletHistory: [
        {
            amount: { type: Number },
            date: { type: Date, default: Date.now },
            description: { type: String }
        }
    ],
    // _id:{type:String}
});

export const UserModel = mongoose.model<UserDocument>('user', UserSchema)