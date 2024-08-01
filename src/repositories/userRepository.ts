
import { IUserRepository } from "../providers/interfaces/IUserRepository";
import { User } from "../entities/User";
import { UserModel } from "../model/userModel";

import bcrypt from "bcryptjs";
import jwt, { VerifyErrors } from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Slot } from "../entities/Slot";
import { ConsultationSlotModel } from "../model/consultationsModel";
import { PaySlot } from "../entities/PaySlot";
import payBookSlotModel from "../model/payBookSlotModel";
import { uploadS3Image } from "../utils/s3uploader";
import { Doctor } from "../entities/Doctor";
import { DoctorDocument, DoctorModel } from "../model/doctorModel";
import ePrescriptionModel, { ePrescriptionDocument } from "../model/ePrescriptionModel";
import { Types } from "mongoose";
import FeedbackModel, { Feedback } from "../model/feedbackModel";
import ChatMessage from "../model/chatMessageModel";


export class UserRepository implements IUserRepository {

  private _otpValue!: string;

  async findByOne(email: string): Promise<User | null> {
    try {
      const existingUserDocument = await UserModel.findOne({ email: email });
      return existingUserDocument;
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }

  async create(
    username: string,
    email: string,
    password: string,
    dateOfbirth: Date,
    isBlocked: boolean,
  ): Promise<User> {
    try {
      const user = {
        username: username,
        email: email,
        password: password,
        dateOfbirth: dateOfbirth,
        isBlocked: isBlocked,
      };

      const newUser = await UserModel.create(user);
      console.log(newUser, "created");
      return newUser;
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }

  async passwordMatch(email: string, password: string): Promise<boolean | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      if (user) {
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        return isPasswordMatch;
      }
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }

  async generateTokens(payload: User): Promise<{ accessToken: string, refreshToken: string }> {
    try {
      // Generate access token
      const accessToken = jwt.sign({
        _id: payload._id,
        username: payload.username,
        email: payload.email,
        password: payload.password,
        dateOfbirth: payload.dateOfbirth,
        isBlocked: payload.isBlocked,
      }, process.env.SECRET_LOGIN as string, { expiresIn: '3h' }); //  Access token expires in 3hrs

      // Generate refresh token
      const refreshToken = jwt.sign({
        _id: payload._id,
      }, process.env.SECRET_LOGIN as string, { expiresIn: '7d' }); //  Refresh token expires in 7 days

      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Error generating tokens:", error);
      throw error;
    }
  };

  async verifyRefreshToken(refreshtoken: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      jwt.verify(refreshtoken, process.env.SECRET_LOGIN as string, (err: VerifyErrors | null, decoded: any) => {
        if (err) {
          resolve(false); // If there is an error, resolve with false
        } else {
          resolve(true); // If verification is successful, resolve with true
        }
      });
    });
  };

  // async jwt(payload: User): Promise<string> {
  //   try {
  //     const plainPayLoad = {
  //       _id: payload._id,
  //       username: payload.username,
  //       email: payload.email,
  //       password: payload.password,
  //       dateOfbirth: payload.dateOfbirth,
  //       isBlocked: payload.isBlocked,
  //     };

  //     const token = jwt.sign(plainPayLoad, process.env.SECRET_LOGIN as string);
  //     return token;
  //   } catch (error) {
  //     console.log("Error", error);
  //     throw error;
  //   }
  // }

  async sendMail(email: string): Promise<{ message: string, token: string }> {
    try {
      if (!email) {
        throw new Error('Email must be provided');
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = jwt.sign({ otp }, process.env.JWT_SECRET as string, { expiresIn: '1m' });
      this._otpValue = token
      // Create Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASS,
        },
      });
      // Email content
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'OTP Verification',
        html: `
          <div style="max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
              <h2 style="text-align: center; color: #333;">Verify Your Account</h2>
              <p style="text-align: center; color: #666;">Hello,</p>
              <p style="text-align: center; color: #666;">We received a request to verify your account. Please enter the OTP below:</p>
              <p style="text-align: center;"><strong>Your OTP is:</strong> ${otp}</p>
              <p style="text-align: center; color: #666;">If you did not make this request, please ignore this email.</p>
              <p style="text-align: center; color: #666;">Thank you!</p>
          </div>`
      };
      // Send mail
      await transporter.sendMail(mailOptions);
      console.log("The OTP is : ", otp);
      return { message: "OTP sent successfully! Please check your email", token };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Error sending email");
    }
  }

  async otpCheck(value: number): Promise<{ isValidOTP: boolean; isExpired: boolean }> {
    try {
      const decodedToken: any = jwt.verify(this._otpValue, process.env.JWT_SECRET as string);
      // Compare the provided OTP with the one stored in the decoded token
      const isValidOTP = Number(decodedToken.otp) === value;
      // Check if the token is expired
      const isExpired = Date.now() >= decodedToken.exp * 1000;
      return { isValidOTP, isExpired };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log("JWT token has expired");
        return { isValidOTP: false, isExpired: true };
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log("JWT token is malformed");
        return { isValidOTP: false, isExpired: true };
      }
      console.error("Error verifying OTP:", error);
      throw new Error("Error verifying OTP");
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    try {
      if (!newPassword) {
        throw new Error('New password is undefined');
      }
      const HashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await UserModel.findOneAndUpdate(
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

  // for booking doctor Slot by user  functionalities
  async getSlotsByDoctorId(doctorId: string, consultationMethod: string): Promise<Slot[]> {
    try {
      const query: any = { doctorId: doctorId, isAvailable: true };
      if (consultationMethod) {
        query.consultationMethod = consultationMethod;
      }
      return await ConsultationSlotModel.find(query).exec();
    } catch (error) {
      console.log("Error fetching slots by doctor id", error);
      throw new Error('error fetching slots by doctor id' + error);
    }
  };

  // saving the payment details to the database...........
  async payBookSlot(paySlot: PaySlot): Promise<PaySlot> {
    try {
      if (paySlot.bookingStatus) {
        const slot = await ConsultationSlotModel.findById(paySlot.slotId);
        if (!slot) {
          throw new Error('Consultation slot not found');
        }
        if (slot.isDefault === true) {
          slot.isAvailable = false;
          slot.date = new Date(slot.date.getTime() + 24 * 60 * 60 * 1000);
          await slot.save();
        } else if (slot.isDefault === false) {
          await ConsultationSlotModel.findByIdAndDelete(paySlot.slotId);
        }
      };

      const newPaySlot = new payBookSlotModel(paySlot);
      const savedPaySlot = await newPaySlot.save();

      await ChatMessage.updateMany(
        {
          senderId: paySlot.userId,
          receiverId: paySlot.doctorId,
          isBooked: false, // Optional: Ensure that it only updating unbooked messages
        },
        { $set: { isBooked: true } }
      );

      return new PaySlot(
        savedPaySlot.paymentid,
        savedPaySlot.amount,
        savedPaySlot.userId,
        savedPaySlot.slotId,
        savedPaySlot.specialtyId,
        savedPaySlot.doctorId,
        savedPaySlot.payBookDate,
        savedPaySlot.startTime,
        savedPaySlot.consultationStatus,
        savedPaySlot.consultationMethod,
        savedPaySlot._id
      );
    } catch (error) {
      throw new Error(`Failed to book slot: ${error}`);
    }
  };

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(userId).exec();
      return user;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error}`);
    }
  }

  async uploadProfileImage(userId: string, photoFile: Express.Multer.File): Promise<void> {
    try {
      const s3Response: any = await uploadS3Image(photoFile)
      if (!s3Response.error) {
        console.log('url of the Image from the s3bucket: ', s3Response.Location)
      } else {
        console.log("Error in uploading image to cloud");
      }
      await UserModel.findByIdAndUpdate(userId, { profilePhoto: s3Response.Location }, { new: true });
    } catch (error) {
      throw new Error('Error updating profile photo in database: ' + error);
    }
  }

  async uploadMedCertificate(userId: unknown, photoFile: unknown): Promise<void> {
    try {
      const s3Response: any = await uploadS3Image(photoFile)
      if (!s3Response.error) {
        console.log('url of the Image from the s3bucket: ', s3Response.Location)
      } else {
        console.log("Error in uploading image to cloud");
      }
      await UserModel.findByIdAndUpdate(userId, { medCertificate: s3Response.Location }, { new: true });
    } catch (error) {
      throw new Error('Error updating profile photo in database: ' + error);
    }
  }

  async updateUser(userId: string, updatedData: Partial<User>): Promise<User> {
    try {
      const updatedUserDoc = await UserModel.findByIdAndUpdate(userId, updatedData, { new: true }).exec();
      if (!updatedUserDoc) {
        throw new Error(`User with id ${userId} not found`);
      }
      return updatedUserDoc;
    } catch (error) {
      throw new Error(`Failed to update user with id ${userId}: ${error}`);
    }
  }

  async getMyBookings(userId: string): Promise<any> {
    try {
      return await payBookSlotModel.find({ userId }).populate('doctorId', 'doctorname').populate('specialtyId', 'specialtyName').exec();
    } catch (error) {
      throw new Error(`Error finding bookings for doctor with ID ${userId}: ${error}`);
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    try {
      return await DoctorModel.find(); // Assuming you're using Mongoose
    } catch (error) {
      throw new Error('Error fetching doctors from the database');
    }
  }

  async cancelBooking(userId: string, bookingId: string, amount: number, status: boolean, cancelledBy: string): Promise<{ booking: PaySlot | null; user: User | null; }> {
    try {
      // Find booking and update its status
      const updatedBooking = await payBookSlotModel.findByIdAndUpdate(
        bookingId,
        { bookingStatus: status, cancelledBy: cancelledBy },
        { new: true }
      );

      if (!updatedBooking) {
        throw new Error('Booking not found');
      }
      // Update user's wallet
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      user.walletMoney += amount;
      user.walletHistory.push({ //This for wallet history details
        amount: amount,
        date: new Date(),
        description: 'Slot cancellation refund'
      });
      await user.save();
      console.log("The updated booking status is when i cancelled from doctor side", updatedBooking);
      console.log("The updated user is doctor side", user);

      return { booking: updatedBooking, user };
    } catch (error) {
      throw new Error('Error cancelling booking and updating wallet: ' + error);
    }
  }

  async walletBooking(paySlot: PaySlot): Promise<PaySlot> {
    try {
      if (paySlot.bookingStatus) {
        const slot = await ConsultationSlotModel.findById(paySlot.slotId);
        if (!slot) {
          throw new Error('Consultation slot not found');
        }
        if (slot.isDefault === true) {
          slot.isAvailable = false;
          slot.date = new Date(slot.date.getTime() + 24 * 60 * 60 * 1000);
          await slot.save();
        } else if (slot.isDefault === false) {
          await ConsultationSlotModel.findByIdAndDelete(paySlot.slotId);
        }
      };
      // Create a new pay slot and save it
      const newPaySlot = new payBookSlotModel(paySlot);
      const savedPaySlot = await newPaySlot.save();
      const user = await UserModel.findById(paySlot.userId);
      if (!user) {
        throw new Error("User not found");
      }
      // Subtract the amount from the user's wallet money
      user.walletMoney -= paySlot.amount;
      if (user.walletMoney < 0) {
        throw new Error("Insufficient wallet money");
      }
      await user.save();
      return new PaySlot(
        savedPaySlot.paymentid,
        savedPaySlot.amount,
        savedPaySlot.userId,
        savedPaySlot.slotId,
        savedPaySlot.specialtyId,
        savedPaySlot.doctorId,
        savedPaySlot.payBookDate,
        savedPaySlot.startTime,
        savedPaySlot.consultationStatus,
        savedPaySlot.consultationMethod,
        savedPaySlot._id
      );
    } catch (error) {
      throw new Error(`Failed to book slot: ${error}`);
    }
  };

  async getPrescriptionsByPatientId(patientId: string): Promise<ePrescriptionDocument[]> {
    try {
      return await ePrescriptionModel.find({ patientId: new Types.ObjectId(patientId) })
        .populate({
          path: 'patientId',
          select: 'username profilePhoto',
          model: 'user'
        })
        .populate({
          path: 'doctorId',
          select: 'doctorname profilePhoto',
          model: 'Doctor'
        })
        .exec();
    } catch (error) {
      throw new Error(`Failed to fetch prescriptions for patientId ${patientId}: ${error}`);
    }
  }

  async getPrescriptionById(prescriptionId: string): Promise<ePrescriptionDocument | null> {
    try {
      return await ePrescriptionModel.findById(new Types.ObjectId(prescriptionId)).exec();
    } catch (error) {
      console.error(`Error fetching prescription by ID: ${error}`);
      throw new Error('Error fetching prescription. Please try again later.');
    }
  }

  //for adding and fetching feedbacks given by the patient.

  async addFeedback(userId: string, doctorId: string, comment: string, rating: number): Promise<Feedback> {
    try {
      const feedback = new FeedbackModel({ userId, doctorId, comment, rating });
      return await feedback.save();
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw new Error('Failed to add feedback. Please try again.');
    }
  }

  async getFeedbacksByDoctorId(doctorId: string, searchText: string): Promise<Feedback[]> {
    try {
      let query = FeedbackModel.find({ doctorId }).populate('userId', 'username profilePhoto').sort({ createdAt: -1 });
      if (searchText) {
        // Case-insensitive search by comment or username
        const searchRegex = new RegExp(searchText, 'i');
        query = query.find({
          $or: [
            { comment: { $regex: searchRegex } },
            { 'userId.username': { $regex: searchRegex } }
          ]
        });
      }
      return await query.exec();
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw new Error('Failed to fetch feedbacks. Please try again.');
    }
  }

  async updateFeedback(feedbackId: string, comment: string, rating: number): Promise<Feedback | null> {
    console.log("Entered into update feedback repository");
    console.log("The id is", feedbackId);
    try {
      const updatedFeedback = await FeedbackModel.findByIdAndUpdate(feedbackId, { comment, rating }, { new: true });
      return updatedFeedback;
    } catch (error) {
      console.error('Error updating feedback in repository:', error);
      throw new Error('Failed to update feedback. Please try again.');
    }
  }

  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      console.log("The feedback id in the delele feedback repository is", feedbackId);

      await FeedbackModel.findByIdAndDelete(feedbackId);
    } catch (error) {
      console.error('Error deleting feedback in repository:', error);
      throw new Error('Failed to delete feedback. Please try again.');
    }
  }














}


