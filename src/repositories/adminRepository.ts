import { IAdminRepository } from "../providers/interfaces/IadminRepository";
import { Admin } from "../entities/Admin";
import { AdminDocument, AdminModel } from "../model/adminModel";
import { UserModel } from "../model/userModel";
import { SpecialtyModel } from "../model/specialtiesModel";
import { DoctorModel } from "../model/doctorModel";
import { User } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import jwt from "jsonwebtoken";
import { uploadS3Image } from "../utils/s3uploader";
import { Specialty } from "../entities/Specialty";
import subscriptionModel from "../model/subscriptionModel";
import { Subscription } from "../entities/Subscription";
import { ConsultationSlotModel } from "../model/consultationsModel";
import { Types } from "mongoose";
import payBookSlotModel, { payBookSlotDocument } from "../model/payBookSlotModel";
import ReportModel, { reportDocument } from "../model/reportModel";
import { sendMail } from "../utils/mailer";



export class adminRepository implements IAdminRepository {

    async findByEmail(email: string): Promise<AdminDocument | null> {
        return await AdminModel.findOne({ email }).exec();
    };

    async create(email: string, password: string): Promise<AdminDocument | null> {
        const admin = new AdminModel({ email, password });
        return await admin.save();
    };

    async findByOne(email: string): Promise<Admin | null> {
        try {
            const adminDocument = await AdminModel.findOne({ email: email });
            console.log(" Already found", adminDocument);
            return adminDocument;
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    };

    async passwordMatch(email: string, password: string): Promise<boolean | null> {
        try {
            const admin = await AdminModel.findOne({ email });
            if (admin?.password === password) {
                return true
            }
            return null
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    };

    jwt(payload: Admin): Promise<string> {
        try {
            const plainPayLoad = {
                _id: payload._id,
                email: payload.email,
                password: payload.password
            }
            const token = jwt.sign(plainPayLoad, process.env.SECRET_LOGIN as string);
            return Promise.resolve(token)
        } catch (error) {
            console.log("Error", error);
            throw error;
        }
    };

    async getAllUsers(): Promise<User[]> {
        try {
            const usersData = await UserModel.find();
            return usersData
            // .map((userData: any) => new User(userData.username, userData.email, userData.password, userData.dateOfbirth, userData.isBlocked, userData._id));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }
    };

    async updateUserStatus(userId: string, isBlocked: boolean): Promise<void> {
        try {
            await UserModel.findByIdAndUpdate(userId, { isBlocked }, { new: true });
        } catch (error) {
            console.error('Error updating user status:', error);
            throw new Error('Failed to update user status');
        }
    };

    async fetchDoctors(page: number, limit: number, searchQuery: string, specialty: string): Promise<{ doctors: Doctor[], totalDoctors: number }> {
        try {
            const skip = (page - 1) * limit;
            let query: any = {};

            // Apply specialty filter if specified
            if (specialty) {
                query.specialty = { $regex: new RegExp(specialty, 'i') };
            }

            // Apply search query filter if specified
            if (searchQuery) {
                const searchRegex = new RegExp(searchQuery, 'i');
                query.$or = [
                    { doctorname: { $regex: searchRegex } },
                    { specialty: { $regex: searchRegex } }
                ];
            }

            const [doctors, totalDoctors] = await Promise.all([
                DoctorModel.find(query).skip(skip).limit(limit),
                DoctorModel.countDocuments(query)
            ]);
            return { doctors, totalDoctors };
        } catch (error) {
            console.error('Error fetching doctors:', error);
            throw new Error('Failed to fetch doctors');
        }
    };

    async updateDoctorStatus(doctorId: string, isBlocked: boolean): Promise<void> {
        try {
            await DoctorModel.findByIdAndUpdate(doctorId, { isBlocked }, { new: true });
        } catch (error) {
            console.error('Error updating doctor status:', error);
            throw new Error('Failed to update doctor status')
        }
    };

    async getDoctorById(doctorId: string): Promise<Doctor> {
        try {
            console.log("The doctor in the repository is", doctorId);
            const doctor = await DoctorModel.findById(doctorId);
            if (!doctor) {
                throw new Error('Doctor not found');
            }
            console.log("The doctor is", doctor);

            return doctor;
        } catch (error) {
            throw new Error('Error fetching doctor: ' + error);
        }
    };

    async verifyDoctor(doctorId: string, isVerified: boolean): Promise<void> {
        try {
            await DoctorModel.findByIdAndUpdate(doctorId, { isVerified }, { new: true });
        } catch (error) {
            console.error('Error Verifying  doctor', error);
            throw new Error('Failed to verify doctor status')
        }
    };

    async addSpecialty(specialtyImage: Express.Multer.File, specialtyName: string, isDocAvailable: boolean, amount: number): Promise<any> {
        try {
            // Upload image to S3
            const s3Response: any = await uploadS3Image(specialtyImage);
            if (s3Response.error) {
                throw new Error("Failed to upload image to S3");
            }
            console.log('URL of the image from the S3 bucket:', s3Response.Location);
            // Save specialty details in database
            const newSpecialty = new SpecialtyModel({
                specialtyImage: s3Response.Location, // Store S3 URL or path in database
                specialtyName,
                isDocAvailable,
                amount
            });
            const savedSpecialty = await newSpecialty.save();
            console.log("The saved new specialty is:", savedSpecialty);
            return savedSpecialty;
        } catch (error) {
            console.error("Failed to create specialty:", error);
            throw new Error("Failed to create specialty:" + error);
        }
    };

    async getSpecialties(): Promise<Specialty[]> {
        try {
            const specialties = await SpecialtyModel.find();
            return specialties
        } catch (error) {
            console.error('Error fetching specialties:', error);
            throw new Error('Failed to fetch specialties');
        }
    };

    async updateSpecialtyStatus(specialtyId: string, isDocAvailable: boolean): Promise<void> {
        try {
            await SpecialtyModel.findByIdAndUpdate(specialtyId, { isDocAvailable }, { new: true });
        } catch (error) {
            console.error('Error updating Specialty status:', error);
            throw new Error('Failed to update Specialty status')
        }
    };

    async deleteSpecialty(specialtyId: string): Promise<void> {
        try {
            console.log("The id of the specialty is ", specialtyId);
            await SpecialtyModel.findByIdAndDelete(specialtyId);
        } catch (error) {
            throw new Error(`Failed to delete specialty:` + specialtyId);
        }
    };

    async getSpecialtyById(specialtyId: string): Promise<Specialty | null> {
        try {
            const specialty = await SpecialtyModel.findById(specialtyId).exec();
            return specialty;
        } catch (error) {
            console.error('Error fetching specialty by ID', error);
            return null;
        }
    };

    async editSpecialty(specialtyId: string, specialtyImage: Express.Multer.File, specialtyName: string, amount: number): Promise<any> {
        try {
            let s3Response: any = {};
            if (specialtyImage) {
                s3Response = await uploadS3Image(specialtyImage);
                if (s3Response.error) {
                    throw new Error("Failed to upload image to S3");
                }
            }

            const updateData: any = {
                specialtyName,
                amount
            };

            if (s3Response.Location) {
                updateData.specialtyImage = s3Response.Location;
            }

            const updatedSpecialty = await SpecialtyModel.findByIdAndUpdate(specialtyId, updateData, { new: true });
            if (!updatedSpecialty) {
                throw new Error("Specialty not found");
            }
            return updatedSpecialty;
        } catch (error) {
            console.error("Failed to edit specialty:", error);
            throw new Error("Failed to edit specialty:" + error);
        }
    };

    async getDoctorsBySpecialty(specialtyName: string): Promise<any> {
        try {
            console.log("Entered to here blahhhh");
            console.log("The name recieved in the repo", specialtyName);
            const doctors = await DoctorModel.find({ specialty: specialtyName }).exec();
            console.log("The doctors return are", doctors);
            return doctors;
        } catch (error) {
            throw new Error('Error fetching doctors by specialty: ' + error);
        }
    };

    async createSubscription(subscription: Subscription): Promise<Subscription> {
        try {
            return await subscriptionModel.create(subscription);
        } catch (error) {
            throw new Error(`Error creating subscription: ${error}`);
        }
    };

    async updateSlotStatus(slotId: string, isBooked: boolean): Promise<any> {
        try {
            const updatedSlot = await ConsultationSlotModel.findOneAndUpdate(
                { _id: new Types.ObjectId(slotId) },
                { isBooked: isBooked },
                { new: true }
            ).exec();
            console.log("The updated slot is", updatedSlot);
            const slots = await ConsultationSlotModel.find()

            return slots;
        } catch (error) {
            console.error('Error updating slot status in repository:', error);
            throw new Error('Failed to update slot status');
        }
    };

    getBookingsData(): Promise<payBookSlotDocument[]> {
        try {
            return payBookSlotModel.find().exec()
        } catch (error) {
            throw new Error('Error fetching bookings from the database');
        }
    };

    async getSpecialtiesPaginated(search: string, page: number, limit: number): Promise<{ specialties: Specialty[]; total: number; }> {
        try {
            const query = search ? { specialtyName: { $regex: search, $options: 'i' } } : {};
            const total = await SpecialtyModel.countDocuments(query);
            const specialties = await SpecialtyModel.find(query)
                .skip((page - 1) * limit)
                .limit(limit);
            return { specialties, total };
        } catch (error) {
            console.error('Error fetching paginated specialties:', error);
            throw new Error('Failed to fetch paginated specialties');
        }
    };

    async createReport(reportData: reportDocument): Promise<reportDocument> {
        try {
            const createdReport = new ReportModel(reportData);
            await createdReport.save();
            return createdReport;
        } catch (error) {
            console.error('Error in create report repository:', error);
            throw error;
        }
    };

    async getAllReports(): Promise<reportDocument[]> {
        try {
            const reports = await ReportModel.find().exec();

            // Manually populate the reporter and reported user names based on their roles
            for (const report of reports) {
                if (report.reporterRole === 'patient') {
                    const user = await UserModel.findById(report.reporterId, 'username email').exec();
                    if (user) {
                        report.set('reporterName', user.username, { strict: false });
                        report.set('reporterEmail', user.email, { strict: false });
                    }
                } else if (report.reporterRole === 'doctor') {
                    const doctor = await DoctorModel.findById(report.reporterId, 'doctorname email').exec();
                    if (doctor) {
                        report.set('reporterName', doctor.doctorname, { strict: false });
                        report.set('reporterEmail', doctor.email, { strict: false });
                    }
                }

                if (report.reportedUserRole === 'patient') {
                    const user = await UserModel.findById(report.reportedUserId, 'username email').exec();
                    if (user) {
                        report.set('reportedUserName', user.username, { strict: false });
                        report.set('reportedUserEmail', user.email, { strict: false });
                    }
                } else if (report.reportedUserRole === 'doctor') {
                    const doctor = await DoctorModel.findById(report.reportedUserId, 'doctorname email').exec();
                    if (doctor) {
                        report.set('reportedUserName', doctor.doctorname, { strict: false });
                        report.set('reportedUserEmail', doctor.email, { strict: false });
                    }
                }
            }
            console.log("The reports are",reports);
            
            return reports;
        } catch (error) {
            console.error('Error in get all reports repository:', error);
            throw error;
        }
    };

    async changeReportStatus(reportId: string): Promise<reportDocument | null> {
        try {
            const report = await ReportModel.findById(reportId).exec();
            if (!report) {
                throw new Error('Report not found');
            }
            report.status = !report.status;
            await report.save();

            // Get the reporter's email
            let reporterEmail = '';
            if (report.reporterRole === 'patient') {
                const user = await UserModel.findById(report.reporterId).exec();
                if (user) reporterEmail = user.email;
            } else if (report.reporterRole === 'doctor') {
                const doctor = await DoctorModel.findById(report.reporterId).exec();
                if (doctor) reporterEmail = doctor.email;
            }

            if (reporterEmail) {
                // Send an email notification
                await sendMail({
                    to: reporterEmail,
                    subject: 'Report Status Update',
                    text: "We have received your report and taken appropriate action. Thank you for helping us maintain a safe community",
                });
            }

            return report;
        } catch (error) {
            console.error('Error in changeReportStatus repository:', error);
            throw error;
        }
    };







}
