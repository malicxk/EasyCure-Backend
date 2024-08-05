import { NextFunction, Request, Response } from "express";
import { IDoctorInteractor } from "../providers/interfaces/IdoctorInteractor";
import { Doctor } from "../entities/Doctor";
import { isValidEmail } from "../utils/validEmail";
import { isValidPassword } from "../utils/validPassword";
import { isValidName } from "../utils/validName";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

enum StatusCodes {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502,
    CONFLICT = 409
}

export class DoctorController {
    private doctorDatas!: Doctor
    private _interactor: IDoctorInteractor
    constructor(interactor: IDoctorInteractor) {
        this._interactor = interactor;
    };

    async docSignUp(req: Request, res: Response): Promise<void> {
        try {
            const { doctorname, email, password, dateOfbirth, specialty, description, workExperience, isBlocked } = req.body;

            if (!isValidName(doctorname)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: 'Invalid Name Format' })
                return
            }
            if (!isValidEmail(email)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: "Invalid Email Format" });
                return
            }
            if (!isValidPassword(password)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: "Invalid PassWord" });
                return
            }
            // Check if the Doctor already exists
            const existingDoctor: Doctor | null = await this._interactor.login(email)
            if (existingDoctor) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Email already exists" });
                return

            }
            const HashedPassWord = bcrypt.hashSync(password, 10);
            this.doctorDatas = {
                doctorname,
                email,
                password: HashedPassWord,
                dateOfbirth,
                specialty,
                description,
                workExperience,
                isBlocked: false,
            }
            const { message } = await this._interactor.sendMail(email);
            console.log(`Sent email to ${this.doctorDatas.email}`);
            res.status(StatusCodes.OK).json({ message });
        } catch (error) {
            console.error('Error signing up:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return
        }
    };

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const doctor: Doctor | null = await this._interactor.login(email);
            if (!doctor) {
                res.status(StatusCodes.NOT_FOUND).json({ message: 'Doctor not found' });
                return;
            }
            if (doctor.isBlocked) {
                res.status(StatusCodes.FORBIDDEN).json({ message: 'Doctor is blocked. Please contact admin for assistance.' });
                return;
            }
            const isValidPassword: boolean | undefined = await this._interactor.checkpass(email, password);
            if (isValidPassword === undefined) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
                return;
            }
            if (!isValidPassword) {
                res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid password' });
                return;
            }
            const token: string = await this._interactor.jwt(doctor);
            res.status(StatusCodes.OK).json({ token, doctor });
            return
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return
        }
    };

    async docOTPverify(req: Request, res: Response): Promise<void> {
        try {
            const { otp } = req.body;
            const otpResult = await this._interactor.checkotp(Number(otp));
            if (otpResult.isValidOTP) {
                if (otpResult.isExpired) {
                    res.status(StatusCodes.BAD_REQUEST).json({ message: "Expired" });
                } else {
                    const newDoc: Doctor = await this._interactor.signUp(this.doctorDatas.doctorname, this.doctorDatas.email, this.doctorDatas.password, this.doctorDatas.dateOfbirth, this.doctorDatas.specialty, this.doctorDatas.description, this.doctorDatas.workExperience, this.doctorDatas.isBlocked);
                    res.status(StatusCodes.CREATED).json(otpResult);
                }
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid OTP,Please try again!!!" });
            }
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                res.status(StatusCodes.UNAUTHORIZED).json({ error: 'TokenExpiredError', message: 'OTP expired. Please request a new one.' });
            } else {
                console.error('Error verifying OTP:', error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            }
        }
    };

    async ResendOTP(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            console.log('OTP resending to ', email);

            if (!email) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: 'Email is required' });
                return
            }
            const { message } = await this._interactor.sendMail(email);
            res.status(StatusCodes.OK).json({ message });
            return;
        } catch (error) {
            console.error('Error resending OTP:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return;
        }
    };

    async forgotPassword(req: Request, res: Response): Promise<void> {
        const { email } = req.body;
        try {
            const existingUser: Doctor | null = await this._interactor.login(email)
            if (!existingUser) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Email does not exist" });
                return
            }
            const { message } = await this._interactor.sendMail(email);
            res.status(StatusCodes.OK).json({ message });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Error  happened" });
        }
    };

    async forgPassVerifyOTP(req: Request, res: Response): Promise<void> {
        try {
            console.log("The otp values came from the front end is forgpass:", req.body);
            const { otp } = req.body;
            const otpResult = await this._interactor.checkotp(Number(otp));
            if (otpResult.isValidOTP) {
                if (otpResult.isExpired) {
                    res.status(StatusCodes.BAD_REQUEST).json({ message: "Expired" });
                } else {
                    console.log("forgPassOTP validated");
                    res.status(StatusCodes.CREATED).json({ otpResult, message: "OTP validated successfully" });
                }
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid otp" });
            }
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                res.status(StatusCodes.UNAUTHORIZED).json({ error: 'TokenExpiredError', message: 'OTP expired. Please request a new one.' });
            } else {
                console.error('Error verifying OTP:', error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            }
        }
    };

    async resetPassWord(req: Request, res: Response): Promise<void> {
        const { email, Password } = req.body;;
        try {
            if (!email || !Password) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: 'Email or new password is missing' });
                return;
            }
            await this._interactor.resetPassword(email, Password);
            res.status(StatusCodes.OK).json({ message: 'Password reset successfully' });
            return;
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Failed to reset password' });
        }
    };

    async getDoctorDetails(req: Request, res: Response): Promise<void> {
        const doctorId = req.doctor_id;
        try {
            const profile = await this._interactor.fetchDoctorDetails(doctorId as string);
            if (profile) {
                res.json(profile);
                return;
            } else {
                res.status(StatusCodes.NOT_FOUND).json({ message: 'Doctor not found' });
            }
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    };

    async updateDoctorDetails(req: Request, res: Response): Promise<void> {
        const doctorId = req.doctor_id; //  doctor ID is stored in the user object of the request
        const updates = req.body;
        const updatedDoctor = await this._interactor.updateDoctorDetails(doctorId as string, updates);
        if (updatedDoctor) {
            res.json({ updatedDoctor, message: "Your new details are saved!!!" });
        } else {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Doctor not found' });
        }
    };

    //profile photo controller.......
    async uploadProfilePhoto(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.doctor_id;
            const photoFile = req.file as Express.Multer.File;
            console.log("This is the path of ", photoFile);
            await this._interactor.updateProfilePhoto(doctorId as string, photoFile);
            if (!photoFile) {
                throw new Error('Uploaded file path is undefined');
            }
            res.status(StatusCodes.OK).send({ message: 'Profile photo uploaded successfully', photoFile });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: "Internal Server Error" });
        }
    };

    //this is for uploading certificate file..........
    async uploadCertificates(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.doctor_id;
            const certificateFiles = req.files as Express.Multer.File[]; // Handle array of files
            if (!certificateFiles || certificateFiles.length === 0) {
                res.status(StatusCodes.BAD_REQUEST).send({ message: 'No files uploaded' });
                return;
            }
            await this._interactor.uploadCertificates(doctorId as string, certificateFiles);
            res.status(StatusCodes.OK).send({ message: 'Certificates uploaded successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: "Internal Server Error", error: errorMessage });
        }
    };

    //creating the consultation slots
    async createConsultationSlot(req: Request, res: Response): Promise<void> {
        const doctorId = req.doctor_id;
        const { date, startTime, consultationMethod, isDefault } = req.body;
        try {
            const newSlot = await this._interactor.createSlot(doctorId as string, date, startTime, consultationMethod, isDefault);
            res.status(StatusCodes.CREATED).json({ newSlot, message: "New slot created" });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    async getSlots(req: Request, res: Response): Promise<void> {
        const doctorId = req.doctor_id
        try {
            const slots = await this._interactor.getSlotsByDoctor(doctorId as string);
            if (slots.length === 0) {
                res.status(StatusCodes.NOT_FOUND).json({ message: "No consultation slots available" });
                return;
            }
            res.status(StatusCodes.OK).json({ slots, message: 'Consultation slots fetched successfully' });
        } catch {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching consultation slots' });
        }
    };

    async updateConsultationSlotStatus(req: Request, res: Response): Promise<void> {
        try {
            const { slotId } = req.params;
            const { isAvailable } = req.body;
            await this._interactor.updateSlotStatus(slotId, isAvailable);
            res.status(StatusCodes.OK).json({ message: "New status updated!!!" });
            return;
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        }
    };

    async deleteSlot(req: Request, res: Response): Promise<void> {
        try {
            const slotId = req.params.slotId;
            await this._interactor.deleteSlot(slotId);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting consultation slot:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to delete consultation slot' });
        }
    };

    //for getting bookings listing
    async getBookingsVirtual(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.doctor_id
            const bookings = await this._interactor.getBookingsForDoctor(doctorId as string);
            res.status(StatusCodes.OK).json({ bookings });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching bookings', error });
        }
    };
    //this is for showing the chat messages in the client side.......
    async getMessages(req: Request, res: Response): Promise<void> {
        const { senderId, receiverId } = req.params;
        try {
            const messages = await this._interactor.fetchMessages(senderId, receiverId);
            res.status(StatusCodes.OK).json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch messages' });
        }
    };

    async getUserDetailsByBookingId(req: Request, res: Response): Promise<void> {
        try {
            const { bookingId } = req.params
            const userDetails = await this._interactor.getUserDetailsByBookingId(bookingId);
            res.status(StatusCodes.OK).json(userDetails);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    async getDoctorDetailsById(req: Request, res: Response) {
        const { doctorId } = req.params
        try {
            const doctor = await this._interactor.fetchDoctorDetails(doctorId as string);
            res.status(StatusCodes.OK).json(doctor);
        } catch (error) {
            console.error('Error fetching doctor details:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    };

    async uploadEPrescription(req: Request, res: Response): Promise<void> {
        const { doctorId, patientId, prescriptionData, slotId } = req.body;
        try {
            await this._interactor.uploadEPrescription(doctorId, patientId, prescriptionData, slotId);
            res.status(StatusCodes.CREATED).send({ message: 'Prescription uploaded successfully.' });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ error: 'Failed to upload prescription.' });
        }
    };





}
