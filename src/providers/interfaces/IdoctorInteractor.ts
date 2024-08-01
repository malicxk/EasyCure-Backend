import { Doctor } from "../../entities/Doctor";
import { IChatMessage } from "../../model/chatMessageModel";
import { ConsultationSlotDocument } from "../../model/consultationsModel";


export interface IDoctorInteractor {
    login(email: string): Promise<Doctor | null>;
    signUp(
        doctorname: string,
        email: string,
        password: string,
        dateOfbirth: string,
        specialty: string,
        description: string,
        workExperience: string,
        isBlocked: boolean,
    ): Promise<Doctor>;
    checkpass(email: string, password: string): Promise<boolean | undefined>;
    jwt(payload: Doctor): Promise<string>;
    sendMail(email: string): Promise<{ message: string }>;
    checkotp(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean; }>;
    resetPassword(email: string, newPassword: string): Promise<void>;
    fetchDoctorDetails(doctorId: string): Promise<Doctor | null>;
    updateDoctorDetails(doctorId: string, updates: Partial<Doctor>): Promise<Doctor | null>;
    updateProfilePhoto(userId: string, photoFile: Express.Multer.File): Promise<void>;
    uploadCertificates(doctorId: string, certificateFiles: Express.Multer.File[]): Promise<void>;
    //consultation slots
    createSlot(doctorId: string, date: Date, startTime: string, consultationMethod: string, isDefault: boolean): Promise<ConsultationSlotDocument>;
    getSlotsByDoctor(doctorId: string): Promise<ConsultationSlotDocument[]>;
    updateSlotStatus(slotId: string, isAvailable: boolean): Promise<void>;
    deleteSlot(slotId: string): Promise<void>;
    getBookingsForDoctor(doctorId: string): Promise<any>;
    fetchMessages(senderId: string, receiverId: string): Promise<IChatMessage[]>;
    getUserDetailsByBookingId(bookingId: string): Promise<any>;
    //for uploading prescription
    uploadEPrescription(doctorId: string, patientId: string, prescriptionData: string, slotId: string): Promise<void>;

}