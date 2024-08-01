import { IDoctorRepository } from "../providers/interfaces/IdoctorRepository";
import { IDoctorInteractor } from "../providers/interfaces/IdoctorInteractor";
import { Doctor } from "../entities/Doctor";
import { ConsultationSlotDocument } from "../model/consultationsModel";
import { IChatMessage } from "../model/chatMessageModel";

export class DoctorInteractor implements IDoctorInteractor {
    private _repository: IDoctorRepository
    constructor(repository: IDoctorRepository) {
        this._repository = repository;
    };

    async login(email: string): Promise<Doctor | null> {
        try {
            return await this._repository.findByOne(email)
        } catch (error) {
            console.error("Error in Login", error)
            throw error;
        }
    };

    async signUp(doctorname: string, email: string, password: string, dateOfbirth: string, specialty: string, description: string, workExperience: string, isBlocked: boolean): Promise<Doctor> {
        try {
            return await this._repository.create(
                doctorname,
                email,
                password,
                dateOfbirth,
                specialty,
                description,
                workExperience,
                isBlocked
            )
        } catch (error) {
            console.error("Error in Signup", error);
            throw error;
        }
    };

    async checkpass(email: string, password: string): Promise<boolean | undefined> {
        try {
            return await this._repository.passwordMatch(email, password);
        } catch (error) {
            console.error("Error in Checkpass: ", error);
            throw error
        }
    };

    async jwt(payload: Doctor): Promise<string> {
        try {
            return await this._repository.jwt(payload);
        } catch (error) {
            console.error("Error in Jwt: ", error);
            throw error;
        }
    };

    async sendMail(email: string): Promise<{ message: string }> {
        try {
            return await this._repository.sendMail(email);
        } catch (error) {
            console.error("Error in SendMail: ", error);
            throw error
        }
    };

    async checkotp(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean; }> {
        try {
            return await this._repository.otpCheck(value);
        } catch (error) {
            console.error("Error in CheckOtp: ", error);
            throw error;
        }
    };

    async resetPassword(email: string, newPassword: string): Promise<void> {
        try {
            if (!email || !newPassword) {
                throw new Error('Email or new password is missing');
            }
            return await this._repository.resetPassword(email, newPassword);
        } catch (error) {
            console.error('Error resetting password:', error);
            throw new Error('Error resetting password');
        }
    };

    async fetchDoctorDetails(doctorId: string): Promise<Doctor | null> {
        try {
            return await this._repository.getDoctorById(doctorId);
        } catch (error) {
            console.error('Error fetching doctor details:', error);
            return null;
        }
    };

    async updateDoctorDetails(doctorId: string, updates: Partial<Doctor>): Promise<Doctor | null> {
        try {
            return this._repository.updateDoctorDetails(doctorId, updates);
        } catch (error) {
            throw new Error('Error updating doctor details: ' + error);
        }
    };

    async updateProfilePhoto(doctorId: string, photoFile: Express.Multer.File): Promise<void> {
        try {
            await this._repository.updateProfilePhotoInDB(doctorId, photoFile);
        } catch (error) {
            throw new Error('Error updating profile photo: ' + error);
        }
    };

    async uploadCertificates(doctorId: string, certificateFiles: Express.Multer.File[]): Promise<void> {
        try {
            const uploadPromises = certificateFiles.map(file => this._repository.uploadCertificates(doctorId, file));
            await Promise.all(uploadPromises);
        } catch (error) {
            throw new Error('Error uploading certificates: ' + error);
        }
    };
    //consultation slots operations.................
    async createSlot(doctorId: string, date: Date, startTime: string, consultationMethod: string, isDefault: boolean): Promise<ConsultationSlotDocument> {
        try {
            return await this._repository.createSlot(doctorId, date, startTime, consultationMethod, isDefault);
        } catch (error) {
            console.error('Interactor error: Unable to create consultation slot - ', error);
            throw error;
        }
    };

    async getSlotsByDoctor(doctorId: string): Promise<ConsultationSlotDocument[]> {
        try {
            return await this._repository.getSlotsByDoctor(doctorId);
        } catch (error) {
            throw new Error('Interactor error: Unable to fetch consultation slots for doctor - ' + error);
        }
    };

    async updateSlotStatus(slotId: string, isAvailable: boolean): Promise<void> {
        try {
            await this._repository.updateSlotStatus(slotId, isAvailable);
        } catch (error) {
            throw new Error('Interactor error:Unble to change status of slot-' + error)
        }
    };


    async deleteSlot(slotId: string): Promise<void> {
        try {
            await this._repository.deleteSlot(slotId);
        } catch (error) {
            throw new Error('Interactor error: Unable to delete consultation slot - ' + error);
        }
    };

    async getBookingsForDoctor(doctorId: string): Promise<any> {
        try {
            return await this._repository.getBookingsForDoctor(doctorId);
        } catch (error) {
            throw new Error(`Error fetching bookings for doctor with ID ${doctorId}: ${error}`);
        }
    };

    async fetchMessages(senderId: string, receiverId: string): Promise<IChatMessage[]> {
        try {
            return await this._repository.fetchMessages(senderId, receiverId);
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    };

    async getUserDetailsByBookingId(bookingId: string): Promise<any> {
        try {
            return await this._repository.getUserDetailsByBookingId(bookingId);
        } catch (error) {
            throw new Error(`Error in interactor while fetching user details: ${error}`);
        }
    };

    async uploadEPrescription(doctorId: string, patientId: string, prescriptionData: string, slotId: string): Promise<void> {
        try {
            await this._repository.uploadEPrescription(doctorId, patientId, prescriptionData, slotId);
        } catch (error) {
            throw new Error("Error in uploading prescription");
        }
    };





}