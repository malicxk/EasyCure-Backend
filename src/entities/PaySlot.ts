import { Types } from "mongoose";

export class PaySlot {
  constructor(
    public readonly paymentid: string,
    public readonly amount: number,
    public readonly userId: Types.ObjectId,
    public readonly slotId: string,
    public readonly specialtyId: Types.ObjectId,
    public readonly doctorId: Types.ObjectId,
    public readonly payBookDate: Date,
    public readonly startTime: string,
    public readonly consultationStatus: boolean,
    public readonly consultationMethod: string,
    public readonly bookingStatus:boolean,
    public readonly _id?: string
  ) { }
}