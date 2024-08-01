import { Request, Response } from 'express';
import { Admin } from '../entities/Admin';
import { IAdminInteractor } from '../providers/interfaces/IadminInteractor';
import { reportDocument } from '../model/reportModel';


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

export class AdminController {
  private _interactor: IAdminInteractor
  constructor(interactor: IAdminInteractor) {
    this._interactor = interactor;
  }

  async registerAdmin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const result = await this._interactor.RegisterAdmin(email, password);
      res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      console.error('Error registering admin:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async loginAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const admin: Admin | null = await this._interactor.login(email);
      if (!admin) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Admin Not Found' });
        return;
      }
      const isValidPassword = await this._interactor.checkpass(email, password);
      console.log('The Password is not Valid', isValidPassword);
      if (isValidPassword === null) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid Password or Email' });
        return;
      }
      //Here Jwt token is Generated;
      const token: string = await this._interactor.jwt(admin);
      res.status(StatusCodes.OK).json({ token });
      return;
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
      return
    }
  }

  //This is the controller for fetch all user in the userLising page in the admin side
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this._interactor.fetchUsers();
      res.status(StatusCodes.OK).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  //Controller for blocking and unblocking user//
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isBlocked } = req.body;
      await this._interactor.updateUserStatus(userId, isBlocked);
      res.status(StatusCodes.OK).json({ message: 'User status updated successfully' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1; // Default to page 1 if not specified
      const limit = parseInt(req.query.limit as string) || 10; // Default to 10 items per page
      const searchQuery = req.query.searchQuery ? req.query.searchQuery.toString() : '';
      const specialty = req.query.specialty ? req.query.specialty.toString() : '';

      const { doctors, totalDoctors } = await this._interactor.fetchDoctors(page, limit, searchQuery, specialty);

      res.status(StatusCodes.OK).json({ doctors, totalDoctors });
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async updateDoctorStatus(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { isBlocked } = req.body;
      await this._interactor.updateDoctorStatus(doctorId, isBlocked);
      res.status(StatusCodes.OK).json({ message: 'Doctor status updated successfully' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async viewDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = req.params.doctorId;
      console.log("The id in the backend is", doctorId);

      const doctor = await this._interactor.fetchDoctorById(doctorId);
      res.json(doctor);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed get doctor profile" });
    }
  }

  async verifyDoctor(req: Request, res: Response): Promise<void> {
    const { doctorId } = req.params;
    const { isVerified } = req.body;
    try {
      await this._interactor.verifyDoctor(doctorId, isVerified);
      res.status(StatusCodes.OK).send({ message: 'Doctor verified successfully' });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).send({ message: "Error verifying Doctor" });
    }
  }

  async getSpecialties(req: Request, res: Response): Promise<void> {
    try {
      const { search, page, limit } = req.query;
      if (page && limit) {
        const paginatedResult = await this._interactor.getSpecialtiesPaginated(search as string, Number(page), Number(limit));
        res.status(StatusCodes.OK).json(paginatedResult);
      } else {
        const specialties = await this._interactor.getSpecialties();
        res.status(StatusCodes.OK).json(specialties);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async updateSpecialtyStatus(req: Request, res: Response): Promise<void> {
    try {
      const { specialtyId } = req.params;
      const { isDocAvailable } = req.body;
      await this._interactor.updateSpecialtyStatus(specialtyId, isDocAvailable);
      res.status(StatusCodes.OK).json({ message: 'Specialty status updated successfully' });
    } catch (error) {
      console.error('Error updating Specialty status:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  }

  async addSpecialty(req: Request, res: Response): Promise<void> {
    const { specialtyName, isDocAvailable, amount } = req.body;
    const specialtyImage = req.file as Express.Multer.File;
    try {
      const newSpecialty = await this._interactor.addSpecialty(specialtyImage, specialtyName, isDocAvailable, amount);
      if (!specialtyImage) {
        throw new Error('Uploaded file path is undefined');
      }
      res.status(StatusCodes.CREATED).json({ newSpecialty, message: 'New specialty added' });
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error adding specialty" });
    }
  }

  async deleteSpecialty(req: Request, res: Response): Promise<void> {
    try {
      const { specialtyId } = req.params;
      await this._interactor.deleteSpecialty(specialtyId);
      res.sendStatus(204);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Error deleting specialty');
    }
  }

  async viewSpecialty(req: Request, res: Response): Promise<void> {
    const { specialtyId } = req.params;
    try {
      const specialty = await this._interactor.getSpecialtyById(specialtyId);
      if (specialty) {
        res.status(StatusCodes.OK).json(specialty);
      } else {
        res.status(StatusCodes.NOT_FOUND).json({ message: `Specialty with ID ${specialtyId} not found` });
      }
    } catch (error) {
      console.error('Error in getSpecialtyById controller', error);
      res.status(500).json({ message: 'Failed to fetch specialty' });
    }
  }

  async editSpecialty(req: Request, res: Response): Promise<void> {
    const { specialtyId } = req.params;
    const { specialtyName, amount } = req.body;
    const specialtyImage = req.file as Express.Multer.File;
    try {
      const updatedSpecialty = await this._interactor.editSpecialty(specialtyId, specialtyImage, specialtyName, amount);
      if (!specialtyImage) {
        throw new Error('Uploaded file path is undefined');
      }
      res.status(StatusCodes.OK).json({ updatedSpecialty, message: 'New changes are saved' });
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Error editing specialty" });
    }
  }
  //for fetching doctors based on the associated specialties.
  async getDoctorsBySpecialty(req: Request, res: Response): Promise<void> {
    const specialtyName = req.params.specialtyName;
    try {
      const doctors = await this._interactor.getDoctorsBySpecialty(specialtyName);
      res.status(StatusCodes.OK).json({ doctors, message: 'Successfully fetched doctors by specialty' });
    } catch (error) {
      console.error('Error fetching doctors by specialty:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
  }

  //for updating slotStatus into booked.......
  async updateSlotStatus(req: Request, res: Response): Promise<void> {
    const { slotId } = req.params;
    const { isBooked } = req.body;
    try {
      const slots = await this._interactor.updateSlotStatus(slotId, isBooked);
      console.log("the updated slot is ", slots);

      res.status(StatusCodes.OK).json({ message: "slot booked", slots });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error });
    }
  }

  //for creating subscription...............
  async addSubscription(req: Request, res: Response): Promise<void> {
    try {
      const subscriptionData = req.body;
      const createdSubscription = await this._interactor.createSubscription(subscriptionData);
      res.status(StatusCodes.CREATED).json(createdSubscription);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  }

  //this is for chart in the admin side...
  async getBookingsData(req: Request, res: Response): Promise<void> {
    try {
      const bookings = await this._interactor.getBookingsData();
      res.status(StatusCodes.OK).json(bookings);
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Fetching bookings failed!', error: error });
    }
  }

  //for handing patient/doctor reports.
  async createReport(req: Request, res: Response): Promise<void> {
    try {
      const reportData: reportDocument = req.body;
      const createdReport = await this._interactor.createReport(reportData);
      res.status(StatusCodes.CREATED).json(createdReport);
    } catch (error) {
      console.error('Error submitting report:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  }

  async getAllReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await this._interactor.getAllReports();
      res.status(StatusCodes.OK).json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
  }

  async changeReportStatus(req: Request, res: Response): Promise<void> {
    const { reportId } = req.params;
    try {
      const updatedReport = await this._interactor.changeReportStatus(reportId);
      if (!updatedReport) {
        res.status(StatusCodes.NOT_FOUND).json({ error: 'Report not found' });
        return;
      }
      res.status(StatusCodes.OK).json(updatedReport);
    } catch (error) {
      console.error('Error in toggleReportStatus controller:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }




  }




}




