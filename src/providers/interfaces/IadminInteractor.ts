import { Admin } from "../../entities/Admin";
import { Doctor } from "../../entities/Doctor";
import { User } from "../../entities/User";
import { AdminDocument } from "../../model/adminModel";
import { Specialty } from "../../entities/Specialty";
import { Subscription } from "../../entities/Subscription";
import { Slot } from "../../entities/Slot";
import { payBookSlotDocument } from "../../model/payBookSlotModel";
import { reportDocument } from "../../model/reportModel";



export interface IAdminInteractor {
  login(email: string): Promise<Admin | null>;
  checkpass(email: string, password: string): Promise<boolean | null>;
  jwt(payload: Admin): Promise<string>;
  RegisterAdmin(email: string, password: string): Promise<{ message: string; admin?: AdminDocument | null }>;
  fetchUsers(): Promise<User[]>;
  updateUserStatus(userId: string, isBlocked: boolean): Promise<void>;
  fetchDoctors(page: number, limit: number, searchQuery: string, specialty: string): Promise<{ doctors: Doctor[], totalDoctors: number }>;
  getSpecialties(): Promise<Specialty[]>;
  getSpecialtiesPaginated(search: string, page: number, limit: number): Promise<{ specialties: Specialty[], total: number }>
  updateDoctorStatus(doctorId: string, isBlocked: boolean): Promise<void>;
  updateSpecialtyStatus(specialtyId: string, isDocAvailable: boolean): Promise<void>;
  fetchDoctorById(doctorId: string): Promise<Doctor>;
  verifyDoctor(doctorId: string, isVerified: boolean): Promise<void>;
  addSpecialty(specialtyImage: Express.Multer.File, specialtyName: string, isDocAvailable: boolean, amount: number): Promise<any>;
  deleteSpecialty(specialtyId: string): Promise<void>;
  getSpecialtyById(specialtyId: string): Promise<Specialty | null>;//to fetch one specialty by id
  editSpecialty(specialtyId: string, specialtyImage: Express.Multer.File, specialtyName: string, amount: number): Promise<any>;
  getDoctorsBySpecialty(specialtyName: string): Promise<string[]>;
  updateSlotStatus(slotId: string, isBooked: boolean): Promise<Slot | null>
  createSubscription(subscription: Subscription): Promise<Subscription>
  getBookingsData(): Promise<payBookSlotDocument[]>;
  createReport(reportData: reportDocument): Promise<reportDocument>
  getAllReports(): Promise<reportDocument[]>
  changeReportStatus(reportId: string): Promise<reportDocument | null>

}