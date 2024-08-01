import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import { Specialty } from "../entities/Specialty";
import { AdminDocument } from "../model/adminModel";
import { IAdminInteractor } from "../providers/interfaces/IadminInteractor";
import { IAdminRepository } from "../providers/interfaces/IadminRepository";
import { Subscription } from "../entities/Subscription";
import { Slot } from "../entities/Slot";
import { payBookSlotDocument } from "../model/payBookSlotModel";
import { reportDocument } from "../model/reportModel";



export class adminInteractor implements IAdminInteractor {

  private _repository: IAdminRepository;

  constructor(repository: IAdminRepository) {
    this._repository = repository;
  };

  async RegisterAdmin(email: string, password: string): Promise<{ message: string; admin?: AdminDocument | null }> {
    const existingAdmin = await this._repository.findByEmail(email);
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }
    const savedAdmin = await this._repository.create(email, password);
    return { message: 'Admin registered successfully', admin: savedAdmin };
  };

  async login(email: string): Promise<Admin | null> {
    try {
      return await this._repository.findByOne(email)
    } catch (error) {
      console.log("Error in Login", error);
      throw error;
    }
  };

  async checkpass(email: string, password: string): Promise<boolean | null> {
    try {
      return await this._repository.passwordMatch(email, password);
    } catch (error) {
      console.error("Error in Checkpass:", error);
      throw error;
    }
  };

  async jwt(payload: Admin): Promise<string> {
    try {
      return await this._repository.jwt(payload);
    } catch (error) {
      console.error("Error in JWT :", error);
      throw error;
    }
  };

  async fetchUsers(): Promise<User[]> {
    try {
      return await this._repository.getAllUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  };

  async updateUserStatus(userId: string, isBlocked: boolean): Promise<void> {
    console.log("Entered into updateStatus interactor........");
    try {
      await this._repository.updateUserStatus(userId, isBlocked);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  };

  async fetchDoctors(page: number, limit: number, searchQuery: string, specialty: string): Promise<{ doctors: Doctor[], totalDoctors: number }> {
    try {
      return await this._repository.fetchDoctors(page, limit, searchQuery, specialty);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw new Error('Failed to fetch doctors');
    }
  };

  async updateDoctorStatus(doctorId: string, isBlocked: boolean): Promise<void> {
    try {
      await this._repository.updateDoctorStatus(doctorId, isBlocked);
    } catch (error) {
      console.error('Error updating doctor status:', error);
      throw new Error('Failed to update doctor status');
    }
  };

  async fetchDoctorById(doctorId: string): Promise<Doctor> {
    try {
      const doctor = await this._repository.getDoctorById(doctorId);
      return doctor;
    } catch (error) {
      throw new Error('Error fetching doctor details: ' + error);
    }
  };

  async verifyDoctor(doctorId: string, isVerified: boolean): Promise<void> {
    try {
      await this._repository.verifyDoctor(doctorId, isVerified);
    } catch (error) {
      console.log("Error verifying doctor", error);
      throw new Error('Error verifying doctor,(interactor)');
    }
  };

  async addSpecialty(specialtyImage: Express.Multer.File, specialtyName: string, isDocAvailable: boolean, amount: number): Promise<any> {
    try {
      const newSpecialty = await this._repository.addSpecialty(specialtyImage, specialtyName, isDocAvailable, amount);
      return newSpecialty;
    } catch (error) {
      throw new Error('Failed to add specialty:' + error);
    }
  };

  async getSpecialties(): Promise<Specialty[]> {
    try {
      return await this._repository.getSpecialties();
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw new Error('Failed to fetch doctors');
    }
  };

  async updateSpecialtyStatus(specialtyId: string, isDocAvailable: boolean): Promise<void> {
    try {
      await this._repository.updateSpecialtyStatus(specialtyId, isDocAvailable);
    } catch (error) {
      console.error('Error updating Specialty status:', error);
      throw new Error('Failed to update Specialty status');
    }
  };

  async deleteSpecialty(specialtyId: string): Promise<void> {
    try {
      await this._repository.deleteSpecialty(specialtyId);
    } catch (error) {
      throw new Error(`Failed to delete specialty:` + error);
    }
  };

  async getSpecialtyById(specialtyId: string): Promise<Specialty | null> {
    try {
      const specialty = await this._repository.getSpecialtyById(specialtyId);
      return specialty;
    } catch (error) {
      console.error('Error fetching specialty by ID in interactor', error);
      return null;
    }
  };

  async editSpecialty(specialtyId: string, specialtyImage: Express.Multer.File, specialtyName: string, amount: number): Promise<any> {
    try {
      return await this._repository.editSpecialty(specialtyId, specialtyImage, specialtyName, amount);
    } catch (error) {
      throw new Error('Error editing specialty: ' + error);
    }
  };

  async getDoctorsBySpecialty(specialtyName: string): Promise<string[]> {
    try {
      return await this._repository.getDoctorsBySpecialty(specialtyName);
    } catch (error) {
      throw new Error('Interactor error: ' + error);
    }
  };

  async createSubscription(subscription: Subscription): Promise<Subscription> {
    try {
      return await this._repository.createSubscription(subscription);
    } catch (error) {
      throw new Error(`Service error creating subscription: ${error}`);
    }
  };

  async updateSlotStatus(slotId: string, isBooked: boolean): Promise<Slot | null> {
    try {
      const slots = await this._repository.updateSlotStatus(slotId, isBooked);
      return slots;
    } catch (error) {
      console.error('Error updating slot status in service:', error);
      throw new Error('Failed to update slot status');
    }
  };

  async getBookingsData(): Promise<payBookSlotDocument[]> {
    try {
      return await this._repository.getBookingsData()
    } catch (error) {
      throw new Error('Error fetching bookings');
    }
  };

  async getSpecialtiesPaginated(search: string, page: number, limit: number): Promise<{ specialties: Specialty[]; total: number; }> {
    try {
      return await this._repository.getSpecialtiesPaginated(search, page, limit);
    } catch (error) {
      console.error('Error fetching paginated specialties:', error);
      throw new Error('Failed to fetch paginated specialties');
    }
  };

  async createReport(reportData: reportDocument): Promise<reportDocument> {
    try {
      const createdReport = await this._repository.createReport(reportData);
      return createdReport;
    } catch (error) {
      console.error('Error in createReport interactor:', error);
      throw error; // Propagate the error to the controller
    }
  };

  async getAllReports(): Promise<reportDocument[]> {
    try {
      return await this._repository.getAllReports();
    } catch (error) {
      console.error('Error in getAllReports interactor:', error);
      throw error;
    }
  };

  async changeReportStatus(reportId: string): Promise<reportDocument | null> {
    try {
      return await this._repository.changeReportStatus(reportId);
    } catch (error) {
      console.error('Error in changeReportStatus Interactor:', error);
      throw error;
    }
  };










}