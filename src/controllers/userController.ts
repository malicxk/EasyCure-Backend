import { NextFunction, Request, Response } from 'express';
import { User } from '../entities/User';
import { isValidEmail } from '../utils/validEmail';
import { isValidPassword } from '../utils/validPassword';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserInteractor } from '../providers/interfaces/IUserInteractor';
import { PaySlot } from '../entities/PaySlot';
import { v4 as uuidv4 } from 'uuid';
import { isValidName } from '../utils/validName';


enum StatusCodes {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502
}

export class UserController {
    private _interactor: IUserInteractor;
    private userDatas!: User;

    constructor(interactor: IUserInteractor) {
        this._interactor = interactor;
    }

    async signUp(req: Request, res: Response): Promise<void> {
        try {
            console.log(req.body);
            const { username, email, password, dateOfbirth, isBlocked } = req.body;
            if (!isValidEmail(email)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: "Invalid Email Format" });
                return
            }
            if (!isValidPassword(password)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: "Invalid PassWord" });
                return
            }

            if (!isValidName(username)) {
                res.status(StatusCodes.BAD_GATEWAY).json({ message: "Invalid naming format use A-Z characters only" });
                return
            }
            // Check if the user already exists
            const existingUser: User | null = await this._interactor.login(email)
            if (existingUser) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Email already exists" });
                return

            }
            const HashedPassWord = bcrypt.hashSync(password, 10);
            this.userDatas = {
                username,
                email,
                password: HashedPassWord,
                dateOfbirth,
                isBlocked: false,
            }
            // Send email and get response from interactor
            const { message, token } = await this._interactor.sendMail(email);
            console.log(message);
            console.log(`Sent email to ${this.userDatas.email}`);
            res.status(StatusCodes.OK).json({ message, token });
        } catch (error) {
            console.error('Error signing up:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const user: User | null = await this._interactor.login(email);
            if (!user) {
                res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
                return;
            }
            if (user.isBlocked) {
                res.status(StatusCodes.FORBIDDEN).json({ message: 'User is blocked. Please contact admin for assistance.' });
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
            const token = await this._interactor.generateTokens(user);
            res.status(StatusCodes.OK).json({ token, user });
            return
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return
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
            // Invoke the interactor to send OTP 
            const { message, token } = await this._interactor.sendMail(email);
            // If the OTP is successfully resent, send a success response
            res.status(StatusCodes.OK).json({ message, token });
            return;
        } catch (error) {
            console.error('Error resending OTP:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
            return;
        }
    };

    async verifyOTP(req: Request, res: Response): Promise<void> {
        try {
            const { otp } = req.body;
            const otpResult = await this._interactor.checkotp(Number(otp));
            if (otpResult.isValidOTP) {
                if (otpResult.isExpired) {
                    res.status(StatusCodes.BAD_REQUEST).json({ message: "Expired" });
                } else {
                    const newUser: User = await this._interactor.signUp(this.userDatas.username, this.userDatas.email, this.userDatas.password, this.userDatas.dateOfbirth, this.userDatas.isBlocked);
                    res.status(StatusCodes.CREATED).json(otpResult);
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

    async forgPassVerifyOTP(req: Request, res: Response): Promise<void> {
        try {
            const { otp } = req.body;
            const otpResult = await this._interactor.checkotp(Number(otp));
            if (otpResult.isValidOTP) {
                if (otpResult.isExpired) {
                    res.status(StatusCodes.BAD_REQUEST).json({ message: "Expired" });
                } else {
                    console.log("forgPassOTP validated");
                    res.status(StatusCodes.CREATED).json(otpResult);
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

    async forgotPassword(req: Request, res: Response): Promise<void> {
        const { email } = req.body;
        try {
            // Check if the user already exists
            const existingUser: User | null = await this._interactor.login(email)
            if (!existingUser) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: "Email does not exist" });
                return
            }
            const { message, token } = await this._interactor.sendMail(email);
            // Send response with message and token
            res.status(StatusCodes.OK).json({ message, token });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: "Error  happened" });
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
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Failed to reset password' });
        }
    };

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                try {
                    const isRefreshTokenVerified = await this._interactor.verifyRefreshToken(refreshToken);
                    if (isRefreshTokenVerified) {
                        const newAccessToken = await this._interactor.generateTokens(refreshToken);
                        if (newAccessToken) {
                            res.status(StatusCodes.OK).json({ message: 'Token refreshed!', accessToken: newAccessToken });
                        }
                    }
                } catch (error) {
                    throw error;
                }
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({ error: "Refresh token is missing!" });
            }
        } catch (error) {
            console.error(error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
        }
    };

    //slots functionalities............
    async getSlotsByDoctorId(req: Request, res: Response): Promise<void> {
        const { doctorId } = req.params;
        const { consultationMethod } = req.query;
        try {
            const slots = await this._interactor.getSlotsForDoctor(doctorId, consultationMethod as string);
            res.json(slots);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error!" });
        }
    }

    async payBookSlot(req: Request, res: Response): Promise<void> {
        try {
            const { paymentId, specialtyId, userId, slotId, slotDate, startTime, doctorId, amount, consultationStatus, consultationMethod, bookingStatus } = req.body;
            const paySlot = new PaySlot(paymentId, amount, userId, slotId, specialtyId, doctorId, slotDate, startTime, consultationStatus, consultationMethod, bookingStatus);
            const result = await this._interactor.payBookSlot(paySlot);
            res.status(StatusCodes.CREATED).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    async getUserProfile(req: Request, res: Response): Promise<void> {
        const userId = req.user_id
        try {
            const user = await this._interactor.getUserById(userId as string);
            if (!user) {
                res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found!' });
                return;
            }
            res.status(StatusCodes.OK).json(user);
        } catch (error) {
            console.error('Error in getUserProfile controller:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    };

    async uploadProfileImage(req: Request, res: Response): Promise<void> {
        console.log("Entered into the profile photo uploading controller......");
        try {
            const { userId } = req.body
            console.log("The user id is", userId);
            console.log('This is the user id when uploading profile Photo', userId);
            const photoFile = req.file as Express.Multer.File;
            console.log("This is the path of ", photoFile);
            await this._interactor.uploadProfileImage(userId as string, photoFile);
            if (!photoFile) {
                throw new Error('Uploaded file path is undefined');
            }
            res.status(StatusCodes.OK).send({ message: 'Profile photo uploaded successfully', photoFile });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: "Internal Server Error" });
        }
    };

    async uploadMedCertificate(req: Request, res: Response): Promise<void> {
        console.log("Entered into the med certificate uploading controller.........");
        try {
            const { userId } = req.body
            console.log('This is the user id when uploading med Certificate', userId);
            const photoFile = req.file as Express.Multer.File;
            console.log("This is the path of ", photoFile);
            await this._interactor.uploadMedCertificate(userId as string, photoFile);
            if (!photoFile) {
                throw new Error('Uploaded file path is undefined');
            }
            res.status(StatusCodes.OK).send({ message: 'Profile photo uploaded successfully', photoFile });
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ message: "Internal Server Error" });
        }
    };

    async updateUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        const updatedFields = req.body; // Assuming req.body contains the updated fields
        try {
            const updatedUser = await this._interactor.updateUser(userId, updatedFields);
            res.status(StatusCodes.OK).json(updatedUser);
        } catch (error) {
            res.status(StatusCodes.NOT_FOUND).json({ message: error });
        }
    };

    async getMyBookings(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params // Assuming doctor ID is retrieved from authenticated user  ,,,,why this....
            const bookings = await this._interactor.getMyBookings(userId as string);
            res.status(StatusCodes.OK).json(bookings);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error fetching bookings', error });
        }
    };

    async getDoctors(req: Request, res: Response): Promise<void> {
        try {
            const doctors = await this._interactor.getDoctors();
            res.status(StatusCodes.OK).json(doctors);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch doctors', error });
        }
    };

    async cancelBooking(req: Request, res: Response): Promise<void> {
        const { userId, bookingId, amount, newStatus, cancelledBy } = req.body;
        try {
            const result = await this._interactor.cancelBooking(userId, bookingId, amount, newStatus, cancelledBy);
            res.status(StatusCodes.OK).json(result);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    async walletBooking(req: Request, res: Response): Promise<void> {
        const paymentId: string = uuidv4();
        try {
            const { specialtyId, userId, slotId, slotDate, startTime, doctorId, amount, consultationStatus, consultationMethod, bookingStatus } = req.body;
            const paySlot = new PaySlot(paymentId, amount, userId, slotId, specialtyId, doctorId, slotDate, startTime, consultationStatus, consultationMethod, bookingStatus);
            const result = await this._interactor.walletBooking(paySlot);
            res.status(StatusCodes.CREATED).json(result);
        } catch (error) {
            if (error === "Insufficient wallet money") {
                res.status(StatusCodes.BAD_REQUEST).json({ error });
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
            }
        }
    };

    async getPrescriptionsByPatientId(req: Request, res: Response): Promise<void> {
        const { patientId } = req.params;
        try {
            const prescriptions = await this._interactor.getPrescriptionsByPatientId(patientId);
            res.status(StatusCodes.OK).json(prescriptions);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    async downloadPrescription(req: Request, res: Response): Promise<void> {
        const { prescriptionId } = req.params;
        try {
            const pdfBuffer = await this._interactor.generatePrescriptionPDF(prescriptionId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=EasyCure E-prescription.pdf');
            res.send(pdfBuffer);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    //this controller is used for handing feedbacks that were given by the patient.
    async addFeedback(req: Request, res: Response): Promise<void> {
        const { userId, comment, rating } = req.body
        const { doctorId } = req.params;
        try {
            const feedback = await this._interactor.addFeedback(userId, doctorId, comment, rating);
            res.status(StatusCodes.CREATED).json(feedback);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    };

    async getFeedbacksByDoctorId(req: Request, res: Response): Promise<void> {
        const { doctorId } = req.params;
        const searchText = req.query.searchText as string | undefined;

        try {
            const feedbacks = await this._interactor.getFeedbacksByDoctorId(doctorId, searchText as string);
            res.json(feedbacks);
        } catch (error) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error });
        }
    }

    async updateFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { feedbackId } = req.params;
            const { comment, rating } = req.body;
            const feedback = await this._interactor.updateFeedback(feedbackId, comment, rating);
            res.status(StatusCodes.OK).json(feedback);
        } catch (error) {
            console.error('Error updating feedback:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update feedback' });
        }
    }

    async deleteFeedback(req: Request, res: Response): Promise<void> {
        try {
            const { feedbackId } = req.params;
            await this._interactor.deleteFeedback(feedbackId);
            res.status(204).end();
        } catch (error) {
            console.error('Error deleting feedback:', error);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete feedback' });
        }
    }












}




