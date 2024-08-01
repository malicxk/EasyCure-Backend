import { Doctor } from "../../entities/Doctor";
import { PaySlot } from "../../entities/PaySlot";
import { Slot } from "../../entities/Slot";
import { User } from "../../entities/User";
import { ePrescriptionDocument } from "../../model/ePrescriptionModel";
import { Feedback } from "../../model/feedbackModel";

export interface IUserRepository {
  findByOne(email: string): Promise<User | null>;
  create(
    username: string,
    email: string,
    password: string,
    dateOfBirth: Date,
    isBlocked: boolean,
  ): Promise<User>;
  passwordMatch(email: string, password: string): Promise<boolean | undefined>;
  // jwt(payload: User): Promise<string>;
  generateTokens(payload: User): Promise<{ accessToken: string, refreshToken: string }>;
  verifyRefreshToken(refreshtoken: string): Promise<boolean>;
  sendMail(email: string): Promise<{ message: string, token: string }>;
  otpCheck(value: number): Promise<{ isValidOTP: boolean, isExpired: boolean; }>;
  resetPassword(email: string, newPassword: string): Promise<void>;
  //slot functionalites....
  getSlotsByDoctorId(doctorId: string, consultationMethod: string): Promise<Slot[]>;
  payBookSlot(paySlot: PaySlot): Promise<PaySlot>;
  getUserById(userId: string): Promise<User | null>;
  uploadProfileImage(userId: string, photoFile: Express.Multer.File): Promise<void>;
  uploadMedCertificate(userId: string, photoFile: Express.Multer.File): Promise<void>;
  updateUser(userId: string, updatedData: Partial<User>): Promise<User>;
  getMyBookings(userId: string): Promise<any>;
  getDoctors(): Promise<Doctor[]>;
  cancelBooking(userId: string, bookingId: string, amount: number, status: boolean, cancelledBy: string): Promise<{ booking: PaySlot | null, user: User | null }>
  walletBooking(paySlot: PaySlot): Promise<PaySlot>;
  //for getting the e-prescription in the user side......
  getPrescriptionsByPatientId(patientId: string): Promise<ePrescriptionDocument[]>
  getPrescriptionById(prescriptionId: string): Promise<ePrescriptionDocument | null>
  addFeedback(userId: string, doctorId: string, comment: string, rating: number): Promise<Feedback> // for handing feedback given by patient to the doctor......
  getFeedbacksByDoctorId(doctorId: string, searchText: string): Promise<Feedback[]>;
  updateFeedback(feedbackId: string, comment: string, rating: number): Promise<Feedback | null>
  deleteFeedback(feedbackId: string): Promise<void>
}
