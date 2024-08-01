import { Doctor } from "../entities/Doctor";
import { IDoctorRepository } from "../providers/interfaces/IdoctorRepository";
import { DoctorDocument, DoctorModel } from "../model/doctorModel";

import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import nodemailer from 'nodemailer';
import { uploadS3Image } from "../utils/s3uploader";
import { SpecialtyModel } from "../model/specialtiesModel";
import { ConsultationSlotDocument, ConsultationSlotModel } from "../model/consultationsModel";
import payBookSlotModel, { payBookSlotDocument } from "../model/payBookSlotModel";
import mongoose, { Types } from "mongoose";
import ChatMessage, { IChatMessage } from "../model/chatMessageModel";
import ePrescriptionModel from "../model/ePrescriptionModel";


export class DoctorRepository implements IDoctorRepository {

    private otpValue!: string;
    async findByOne(email: string): Promise<Doctor | null> {
        try {
            const existingDoctorDocument = await DoctorModel.findOne({ email: email });
            console.log(existingDoctorDocument);
            return existingDoctorDocument;
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    }

    async create(doctorname: string, email: string, password: string, dateOfbirth: string, specialty: string, description: string, workExperience: string, isBlocked: boolean): Promise<Doctor> {
        try {
            // Check if the specialty exists
            const specialtyDoc = await SpecialtyModel.findOne({ specialtyName: specialty });
            if (!specialtyDoc) {
                throw new Error(`Specialty '${specialty}' not found`);
            }
            const doctor = {
                doctorname: doctorname,
                email: email,
                password: password,
                dateOfbirth: dateOfbirth,
                specialty: specialty,
                description: description,
                workExperience: workExperience,
                isBlocked: isBlocked
            };
            // Create the doctor
            const newDoctor = await DoctorModel.create(doctor);
            console.log(newDoctor, "created");
            // Add doctor to specialty
            await SpecialtyModel.updateOne(
                { specialtyName: specialty },
                { $push: { doctors: doctorname } }
            );
            return newDoctor;
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    }

    async passwordMatch(email: string, password: string): Promise<boolean | undefined> {
        try {
            const doctor = await DoctorModel.findOne({ email });
            if (doctor) {
                const isPasswordMatch = await bcrypt.compare(password, doctor.password);
                return isPasswordMatch;
            }
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    }

    async jwt(payload: Doctor): Promise<string> {
        try {
            const plainPayLoad = {
                _id: payload._id,
                doctorname: payload.doctorname,
                email: payload.email,
                password: payload.password,
                age: payload.dateOfbirth,
                specialty: payload.specialty,
                description: payload.description,
                isBlocked: payload.isBlocked,
            };
            const token = jwt.sign(plainPayLoad, process.env.SECRET_LOGIN as string, { expiresIn: '3h' });
            return token;
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    }

    async sendMail(email: string): Promise<{ message: string; }> {
        try {
            if (!email) {
                throw new Error('Email must be provided');
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            // Generate a JWT containing OTP
            const token = jwt.sign({ otp }, process.env.JWT_SECRET as string, { expiresIn: '1m' });
            this.otpValue = token
            // console.log('token',token);
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASS,
                },
            });
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: 'OTP Verification',
                html: `
                <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                    <h2 style="text-align: center; color: #333;">Verify Your Account</h2>
                    <p style="text-align: center; color: #666;">Hello Doctor,</p>
                    <p style="text-align: center; color: #666;">We received a request to verify your account. Please enter the OTP below:</p>
                    <p style="text-align: center;"><strong>Your OTP is:</strong> ${otp}</p>
                    <p style="text-align: center; color: #666;">If you did not make this request, please ignore this email.</p>
                    <p style="text-align: center; color: #666;">Thank you!</p>
                </div>`
            };
            await transporter.sendMail(mailOptions);
            console.log("The OTP is : ", otp);
            return { message: "OTP sent successfully! Please check your email" };
        } catch (error) {
            console.error("Error sending email:", error);
            throw new Error("Error sending email");
        }
    };

    async otpCheck(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean; }> {
        try {
            console.log("This is the otp Value", value);
            const decodedToken = jwt.verify(this.otpValue, process.env.JWT_SECRET as string) as JwtPayload
            console.log("decoded", decodedToken);
            // Verify the JWT token
            const isValidOTP = Number(decodedToken.otp) === value;
            console.log("the otp value in the jwt is ", this.otpValue);
            const isExpired = Date.now() >= (decodedToken.exp as number) * 1000;
            return Promise.resolve({ isValidOTP, isExpired });
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                console.log("JWT token has expired");
                return Promise.resolve({ isValidOTP: false, isExpired: true });
            } else if (error instanceof jwt.JsonWebTokenError) {
                console.log("JWT token is malformed");
                return Promise.resolve({ isValidOTP: false, isExpired: true });
            }
            console.error("Error verifying OTP:", error);
            throw new Error("Error verifying OTP");
        }
    };

    async resetPassword(email: string, newPassword: string): Promise<void> {
        try {
            if (!newPassword) {
                throw new Error('New password is undefined');
            }
            const HashedPassword = await bcrypt.hash(newPassword, 10);
            const user = await DoctorModel.findOneAndUpdate(
                { email },
                { password: HashedPassword },
                { new: true, runValidators: true }
            );
            if (!user) {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            throw new Error('Error resetting password');
        }
    };

    async getDoctorById(doctorId: string): Promise<Doctor | null> {
        try {
            return await DoctorModel.findById(doctorId)
                .select('email doctorname dateOfbirth specialty description workExperience profilePhoto isVerified certificates')
                .exec();
        } catch (error) {
            console.error('Error fetching doctor by ID:', error);
            return null;
        }
    };

    async updateDoctorDetails(doctorId: string, updates: Partial<Doctor>): Promise<Doctor | null> {
        try {
            const updatedDoctor = await DoctorModel.findByIdAndUpdate(doctorId, updates, { new: true }).exec();
            return updatedDoctor;
        } catch (error) {
            console.error('Error updating doctor details:', error);
            return null;
        }
    };

    //profile photo repository 
    async updateProfilePhotoInDB(doctorId: string, photoFile: Express.Multer.File): Promise<void> {
        try {
            const s3Response: any = await uploadS3Image(photoFile)
            if (!s3Response.error) {
                console.log('url of the Image from the s3bucket: ', s3Response.Location)
            } else {
                console.log("Error in uploading image to cloud");
            }
            await DoctorModel.findByIdAndUpdate(doctorId, { profilePhoto: s3Response.Location }, { new: true });
        } catch (error) {
            throw new Error('Error updating profile photo in database: ' + error);
        }
    };

    //for uploading certificate in the s3bucket....
    async uploadCertificates(doctorId: string, certificateFile: Express.Multer.File): Promise<void> {
        try {
            const s3Response: any = await uploadS3Image(certificateFile);
            if (!s3Response.error) {
                console.log('URL of the Image from the S3 bucket: ', s3Response.Location);
                await DoctorModel.findByIdAndUpdate(
                    doctorId,
                    { $push: { certificates: s3Response.Location } },
                    { new: true }
                );
            } else {
                console.log("Error in uploading image to cloud");
            }
        } catch (error) {
            throw new Error('Error updating profile in database: ' + error);
        }
    };

    //consultation slots operations...........
    async createSlot(doctorId: string, date: Date, startTime: string, consultationMethod: string, isDefault: boolean): Promise<ConsultationSlotDocument> {
        try {
            const existingSlot = await ConsultationSlotModel.findOne({
                doctorId: doctorId,
                date: date,
                startTime: startTime
            });
            if (existingSlot) {
                throw new Error('A slot with the same doctorId, date, and startTime already exists.');
            }
            const newSlot = new ConsultationSlotModel({
                doctorId: doctorId,
                date: date,
                startTime: startTime,
                consultationMethod: consultationMethod,
                isDefault: isDefault
            });
            const savedSlot = await newSlot.save();
            console.log("Saved slot:", savedSlot);
            return savedSlot;
        } catch (error) {
            console.error('Repository error: Unable to create consultation slot - ', error);
            throw Error
        };
    };

    async getSlotsByDoctor(doctorId: string): Promise<ConsultationSlotDocument[]> {
        try {
            const slots = await ConsultationSlotModel.find({ doctorId: new mongoose.Types.ObjectId(doctorId) }).exec();
            console.log("Slots fetched:", slots);
            return slots;
        } catch (error) {
            throw new Error('Repository error: Unable to fetch consultation slots - ' + error);
        }
    };

    async updateSlotStatus(slotId: string, isAvailable: boolean): Promise<void> {
        try {
            await ConsultationSlotModel.findByIdAndUpdate(slotId, { isAvailable }, { new: true }).exec();
        } catch (error) {
            throw new Error('Repository error: Unable to change status of consultation slot - ' + error);
        }
    };

    async deleteSlot(slotId: string): Promise<void> {
        try {
            console.log("id recieved in the repository is", slotId);
            await ConsultationSlotModel.findByIdAndDelete(slotId).exec();
        } catch (error) {
            throw new Error('Repository error: Unable to delete consultation slot - ' + error);
        }
    };

    async getBookingsForDoctor(doctorId: string): Promise<any> {
        try {
            return await payBookSlotModel.find({ doctorId })
                .populate('userId', 'username')
                .exec();
        } catch (error) {
            throw new Error(`Error finding bookings for doctor with ID ${doctorId}: ${error}`);
        }
    };
    //for fetching chat messages..........
    async fetchMessages(senderId: string, receiverId: string): Promise<IChatMessage[]> {
        try {
            return await ChatMessage.find({
                $or: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId }
                ]
            }).sort({ timestamp: 1 }).exec();
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    };

    async getUserDetailsByBookingId(bookingId: string): Promise<any> {
        try {
            const booking = await payBookSlotModel.findById(bookingId)
            if (!booking) {
                throw new Error('Booking not found');
            }
            return booking;
        } catch (error) {
            throw new Error(`Error fetching user details: ${error}`);
        }
    };

    async uploadEPrescription(doctorId: string, patientId: string, prescriptionData: string, slotId: string): Promise<void> {
        try {
            const newPrescription = new ePrescriptionModel({
                doctorId,
                patientId,
                prescriptionData
            });
            await newPrescription.save();

            // Find and update the relevant booking slot
            const updatedSlot = await payBookSlotModel.findOneAndUpdate(
                { doctorId: new Types.ObjectId(doctorId), userId: new Types.ObjectId(patientId), slotId: slotId },
                { consultationStatus: true },
                { new: true } // Return the updated document
            );
            if (!updatedSlot) {
                throw new Error('Booking slot not found');
            }

            console.log("Booking slot updated:", updatedSlot);
        } catch (error) {
            console.error('Error creating prescription:', error);
            throw new Error('Failed to create prescription');
        }
    };











}