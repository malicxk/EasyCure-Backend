import { ObjectId } from 'mongoose';
import { Doctor } from '../../entities/Doctor';
import { PaySlot } from '../../entities/PaySlot';
import { Slot } from '../../entities/Slot';
import { User } from '../../entities/User';
import { DoctorDocument } from '../../model/doctorModel';
import { ePrescriptionDocument } from '../../model/ePrescriptionModel';
import { Feedback } from '../../model/feedbackModel';

export interface IUserInteractor {
    login(email: string): Promise<User | null>;
    signUp(
        username: string,
        email: string,
        password: string,
        dateofbirth: Date,
        isBlocked: boolean
    ): Promise<User>;
    checkpass(email: string, password: string): Promise<boolean | undefined>;
    // jwt(payload:User):Promise<string>;
    generateTokens(payload: User): Promise<{ accessToken: string, refreshToken: string }>
    verifyRefreshToken(refreshtoken: string): Promise<boolean>
    sendMail(email: string): Promise<{ message: string, token: string }>;
    checkotp(value: number): Promise<{ isValidOTP: boolean, isExpired: boolean; }>;
    resetPassword(email: string, newPassword: string): Promise<void>;
    //slots functionalities
    getSlotsForDoctor(doctorId: string, consultationMethod: string): Promise<Slot[]>;
    payBookSlot(paySlot: PaySlot): Promise<PaySlot>;
    getUserById(userId: string): Promise<User | null>;
    uploadProfileImage(userId: string, photoFile: Express.Multer.File): Promise<void>;
    uploadMedCertificate(userId: string, photoFile: Express.Multer.File): Promise<void>;
    updateUser(userId: string, updatedData: Partial<User>): Promise<User>;
    getMyBookings(userId: string): Promise<any>;
    getDoctors(): Promise<Doctor[]>;
    cancelBooking(userId: string, bookingId: string, amount: number, status: boolean, cancelledBy: string): Promise<{ booking: PaySlot | null, user: User | null }>
    walletBooking(paySlot: PaySlot): Promise<PaySlot>;
    //for generating pdf for e-prescription download in the patient side chat...
    getPrescriptionsByPatientId(patientId: string): Promise<ePrescriptionDocument[]>
    generatePrescriptionPDF(prescriptionId: string): Promise<Buffer>;
    //for handing feedback that given by the patient to the doctor
    addFeedback(userId: string, doctorId: string, comment: string, rating: number): Promise<Feedback>
    getFeedbacksByDoctorId(doctorId: string, searchText: string): Promise<Feedback[]>
    updateFeedback(feedbackId: string, comment: string, rating: number): Promise<Feedback | null>
    deleteFeedback(feedbackId: string): Promise<void>

}