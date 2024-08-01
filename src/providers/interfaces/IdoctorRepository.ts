import { Doctor } from "../../entities/Doctor";
import { IChatMessage } from "../../model/chatMessageModel";
import { ConsultationSlotDocument } from "../../model/consultationsModel";

export interface IDoctorRepository {
    findByOne(email: string): Promise<Doctor | null>;
    create(
        doctorname: string,
        email: string,
        password: string,
        dateOfbirth: string,
        specialty: string,
        description: string,
        workExperience: string,
        isBlocked: boolean
    ): Promise<Doctor>;
    passwordMatch(email: string, password: string): Promise<boolean | undefined>;
    jwt(payload: Doctor): Promise<string>;
    sendMail(email: string): Promise<{ message: string }>;
    otpCheck(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean; }>;
    resetPassword(email: string, newPassword: string): Promise<void>;
    getDoctorById(id: string): Promise<Doctor | null>;
    updateDoctorDetails(doctorId: string, updates: Partial<Doctor>): Promise<Doctor | null>;
    updateProfilePhotoInDB(doctorId: string, photoFile: Express.Multer.File): Promise<void>;
    uploadCertificates(doctorId: string, certificateFiles: Express.Multer.File): Promise<void>;
    //consultation slots
    createSlot(doctorId: string, date: Date, startTime: string, consultationMethod: string, isDefault: boolean): Promise<ConsultationSlotDocument>;
    getSlotsByDoctor(doctorId: string): Promise<ConsultationSlotDocument[]>;
    updateSlotStatus(slotId: string, isAvailable: boolean): Promise<void>;
    deleteSlot(slotId: string): Promise<void>;
    getBookingsForDoctor(doctorId: string): Promise<any>;
    getUserDetailsByBookingId(bookingId: string): Promise<any>;
    fetchMessages(senderId: string, receiverId: string): Promise<IChatMessage[]>;
    uploadEPrescription(doctorId: string, patientId: string, prescriptionData: string, slotId: string): Promise<void>;//for uploading prescription by doctor.......

}