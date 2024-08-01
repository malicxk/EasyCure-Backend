import { Admin } from "../../entities/Admin";
import { User } from "../../entities/User";
import { AdminDocument } from "../../model/adminModel";
import { Doctor } from "../../entities/Doctor";
import { Specialty } from "../../entities/Specialty";
import { Subscription } from "../../entities/Subscription";
import { Slot } from "../../entities/Slot";
import { payBookSlotDocument } from "../../model/payBookSlotModel";
import { reportDocument } from "../../model/reportModel";


export interface IAdminRepository {
  findByOne(email: string): Promise<Admin | null>;
  passwordMatch(email: string, password: string): Promise<boolean | null>;
  jwt(payload: Admin): Promise<string>;
  findByEmail(email: string): Promise<AdminDocument | null>;
  create(email: string, password: string): Promise<AdminDocument | null>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, isBlocked: boolean): Promise<void>;
  fetchDoctors(page: number, limit: number, searchQuery: string, specialty: string): Promise<{ doctors: Doctor[], totalDoctors: number }>;
  getSpecialties(): Promise<Specialty[]>;
  getSpecialtiesPaginated(search: string, page: number, limit: number): Promise<{ specialties: Specialty[], total: number }>
  updateDoctorStatus(doctorId: string, isBlocked: boolean): Promise<void>;
  updateSpecialtyStatus(specialtyId: string, isDocAvailable: boolean): Promise<void>;
  getDoctorById(doctorId: string): Promise<Doctor>;
  verifyDoctor(doctorId: string, isVerified: boolean): Promise<void>;
  addSpecialty(specialtyImage: Express.Multer.File, specialtyName: string, isDocAvailable: boolean, amount: number): Promise<any>;
  deleteSpecialty(specialtyId: string): Promise<void>;
  getSpecialtyById(specialtyId: string): Promise<Specialty | null>;//to fetch one specialty by id
  editSpecialty(specialtyId: string, specialtyImage: Express.Multer.File, specialtyName: string, amount: number): Promise<any>;
  getDoctorsBySpecialty(specialtyName: string): Promise<string[]>;
  updateSlotStatus(slotId: string, isBooked: boolean): Promise<Slot | null>
  createSubscription(subscription: Subscription): Promise<Subscription>;
  getBookingsData(): Promise<payBookSlotDocument[]>;
  createReport(reportData: reportDocument): Promise<reportDocument>
  getAllReports(): Promise<reportDocument[]>
  changeReportStatus(reportId: string): Promise<reportDocument | null>

}