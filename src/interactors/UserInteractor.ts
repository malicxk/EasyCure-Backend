import { User } from "../entities/User";
import { IUserInteractor } from "../providers/interfaces/IUserInteractor";
import { IUserRepository } from "../providers/interfaces/IUserRepository";
import dotenv from "dotenv";
import { Slot } from "../entities/Slot";
import { PaySlot } from "../entities/PaySlot";
import { Doctor } from "../entities/Doctor";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ePrescriptionDocument, Medication } from "../model/ePrescriptionModel";
import { Feedback } from "../model/feedbackModel";


dotenv.config();
import * as fs from 'fs';

export class UserInteractor implements IUserInteractor {

    private _repository: IUserRepository;

    constructor(repository: IUserRepository) {
        this._repository = repository;
    }

    async login(email: string): Promise<User | null> {
        try {
            return await this._repository.findByOne(email)
        } catch (error) {
            console.error("Error in Login", error)
            throw error;
        }
    }

    async signUp(username: string, email: string, password: string, dateofbirth: Date, isBlocked: boolean): Promise<User> {
        try {
            return await this._repository.create(
                username,
                email,
                password,
                dateofbirth,
                isBlocked
            )
        } catch (error) {
            console.error("Error in Signup", error);
            throw error;
        }
    }

    async checkpass(email: string, password: string): Promise<boolean | undefined> {
        try {
            return await this._repository.passwordMatch(email, password);
        } catch (error) {
            console.error("Error in Checkpass: ", error);
            throw error
        }
    }

    // async jwt(payload: User): Promise<string> {
    //     try {
    //         return await this._repository.jwt(payload);
    //     } catch (error) {
    //         console.error("Error in Jwt: ", error);
    //         throw error;
    //     }
    // }

    async generateTokens(payload: User): Promise<{ accessToken: string; refreshToken: string; }> {
        try {
            return await this._repository.generateTokens(payload);
        } catch (error) {
            console.error("Error in Jwt: ", error);
            throw error;
        }
    }

    async sendMail(email: string): Promise<{ message: string, token: string }> {
        try {
            return await this._repository.sendMail(email);
        } catch (error) {
            console.error("Error in SendMail: ", error);
            throw error
        }
    }

    async checkotp(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean; }> {
        try {
            return await this._repository.otpCheck(value);
        } catch (error) {
            console.error("Error in CheckOtp: ", error);
            throw error;
        }
    }

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
    }

    async verifyRefreshToken(refreshtoken: string): Promise<boolean> {
        try {
            return await this._repository.verifyRefreshToken(refreshtoken)
        } catch (error) {
            console.error('Error verfiying token:', error);
            throw new Error('Error verfiying token');
        }
    }

    //slots functionalities............

    getSlotsForDoctor(doctorId: string, consultationMethod: string): Promise<Slot[]> {
        try {
            return this._repository.getSlotsByDoctorId(doctorId, consultationMethod);
        } catch (error) {
            throw new Error('Error fetching slots in interactor' + error)
        }
    }

    async payBookSlot(paySlot: PaySlot): Promise<PaySlot> {
        try {
            return await this._repository.payBookSlot(paySlot);
        } catch (error) {
            throw new Error(`Booking slot payment failed: ${error}`);
        }
    }

    async getUserById(userId: string): Promise<User | null> {
        try {
            return await this._repository.getUserById(userId)
        } catch (error) {
            throw new Error("Error fetching user with id")
        }
    }

    async uploadProfileImage(userId: string, photoFile: Express.Multer.File): Promise<void> {
        try {
            return await this._repository.uploadProfileImage(userId, photoFile);
        } catch {
            throw new Error("Error uploading user profile photo");
        }
    }

    async uploadMedCertificate(userId: string, photoFile: Express.Multer.File): Promise<void> {
        try {
            return await this._repository.uploadMedCertificate(userId, photoFile);
        } catch (error) {
            throw new Error("Error uploading med Certificat" + error)
        }
    }

    async updateUser(userId: string, updatedData: Partial<User>): Promise<User> {
        try {
            return await this._repository.updateUser(userId, updatedData);
        } catch (error) {
            throw new Error("Error updating user " + error)
        }
    }

    async getMyBookings(userId: string): Promise<void> {
        try {
            return await this._repository.getMyBookings(userId);
        } catch (error) {
            throw new Error("Error fetching user bookings" + error)
        }
    }

    async getDoctors(): Promise<Doctor[]> {
        try {
            return await this._repository.getDoctors();
        } catch (error) {
            throw new Error('Error fetching doctors');
        }
    }

    async cancelBooking(userId: string, bookingId: string, amount: number, status: boolean, cancelledBy: string): Promise<{ booking: PaySlot | null; user: User | null; }> {
        try {
            return await this._repository.cancelBooking(userId, bookingId, amount, status, cancelledBy);
        } catch (error) {
            throw new Error('Error cancelling booking and updating wallet: ' + error);
        }
    }

    async walletBooking(paySlot: PaySlot): Promise<PaySlot> {
        try {
            return await this._repository.walletBooking(paySlot);
        } catch (error) {
            throw new Error(`Booking slot payment failed: ${error}`);
        }
    }

    async getPrescriptionsByPatientId(patientId: string): Promise<ePrescriptionDocument[]> {
        try {
            return await this._repository.getPrescriptionsByPatientId(patientId);
        } catch (error) {
            throw new Error(`Failed to get prescriptions for patientId ${patientId}: ${error}`);
        }
    }

    async generatePrescriptionPDF(prescriptionId: string): Promise<Buffer> {
        const prescription = await this._repository.getPrescriptionById(prescriptionId);
        if (!prescription) {
            throw new Error('Prescription not found');
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 20;
        const borderMargin = 20;

        // Define colors
        const headerColor = rgb(0, 0.5, 0.5); // Teal color for headers
        const sectionColor = rgb(0.9, 0.9, 0.9); // Light gray for section backgrounds
        const borderColor = rgb(0, 0, 0); // Black color for borders

        // Draw a border around the entire page
        page.drawRectangle({
            x: borderMargin,
            y: borderMargin,
            width: width - 2 * borderMargin,
            height: height - 2 * borderMargin,
            borderColor: borderColor,
            borderWidth: 2
        });

        // Draw header text with color
        page.drawText(`E-Prescription From Easy-Cure`, { x: 50, y: height - 4 * fontSize, size: fontSize + 4, color: headerColor });
        page.drawText(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { x: 50, y: height - 10 * fontSize, size: fontSize });

        const prescriptionData = prescription.prescriptionData;
        let yPosition = height - 12 * fontSize;

        // Draw Doctor and Patient Information with borders
        page.drawText(`Doctor Name: ${prescriptionData.doctorInfo.name}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 1.5 * fontSize;
        page.drawText(`Specialization: ${prescriptionData.doctorInfo.specialization}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 1.5 * fontSize;
        page.drawText(`Doctor Contact: ${prescriptionData.doctorInfo.contact}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 1.5 * fontSize;
        page.drawText(`Patient Name: ${prescriptionData.patientInfo.name}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 1.5 * fontSize;
        page.drawText(`Patient Age: ${prescriptionData.patientInfo.age}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 1.5 * fontSize;
        page.drawText(`Patient Gender: ${prescriptionData.patientInfo.gender}`, { x: 50, y: yPosition, size: fontSize });
        yPosition -= 2 * fontSize;

        // Draw Medications
        page.drawText(`Medications:`, { x: 50, y: yPosition, size: fontSize, font: await pdfDoc.embedFont(StandardFonts.HelveticaBold), color: headerColor });
        yPosition -= 1.5 * fontSize;
        prescriptionData.medications.forEach((medication: Medication, index: number) => {
            page.drawText(`${index + 1}. ${medication.drugName} - ${medication.dosage}`, { x: 70, y: yPosition, size: fontSize });
            yPosition -= 1.5 * fontSize;
            page.drawText(`  Drug Dosage: ${medication.dosage}`, { x: 90, y: yPosition, size: fontSize });
            yPosition -= 1.5 * fontSize;
            page.drawText(`   Form: ${medication.form}`, { x: 90, y: yPosition, size: fontSize });
            yPosition -= 1.5 * fontSize;
            page.drawText(`   Quantity: ${medication.quantity}`, { x: 90, y: yPosition, size: fontSize });
            yPosition -= 1.5 * fontSize;
            page.drawText(`   Instructions: ${medication.instructions}`, { x: 90, y: yPosition, size: fontSize });
            yPosition -= 2 * fontSize;
        });

        // Draw Additional Notes section
        page.drawText(`Additional Notes: ${prescriptionData.additionalNotes}`, { x: 50, y: yPosition, size: fontSize });

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }

    async addFeedback(userId: string, doctorId: string, comment: string, rating: number): Promise<Feedback> {
        try {
            return await this._repository.addFeedback(userId, doctorId, comment, rating);
        } catch (error) {
            // Handle any errors here (e.g., logging, rethrowing, returning default value, etc.)
            console.error('Error adding feedback:', error);
            throw new Error('Failed to add feedback. Please try again.');
        }
    }

    async getFeedbacksByDoctorId(doctorId: string, searchText: string): Promise<Feedback[]> {
        try {
            return await this._repository.getFeedbacksByDoctorId(doctorId, searchText);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            throw new Error('Failed to fetch feedbacks. Please try again.');
        }
    };

    async updateFeedback(feedbackId: string, comment: string, rating: number): Promise<Feedback | null> {
        try {
            return await this._repository.updateFeedback(feedbackId, comment, rating);
        } catch (error) {
            console.error('Error updating feedback in interactor:', error);
            throw new Error('Failed to update feedback. Please try again.');
        }
    };

    async deleteFeedback(feedbackId: string): Promise<void> {
        try {
            await this._repository.deleteFeedback(feedbackId);
        } catch (error) {
            console.error('Error deleting feedback in interactor:', error);
            throw new Error('Failed to delete feedback. Please try again.');
        }
    }









}



