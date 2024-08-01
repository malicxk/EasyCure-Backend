import mongoose from "mongoose";

export class Slot {
    constructor(
      public readonly doctorId: mongoose.Schema.Types.ObjectId,
      public readonly date: Date,
      public readonly startTime: string,
      public readonly isAvailable: boolean
    ) { }
  }
  