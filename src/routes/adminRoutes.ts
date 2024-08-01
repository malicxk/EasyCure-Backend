import { Router } from "express";
import { AdminController } from "../controllers/adminController";
import { adminRepository } from "../repositories/adminRepository";
import { adminInteractor } from "../interactors/adminInteractor";


// import JWT Stuffs../
import authenticateAdminToken from "../middleware/adminAuthMiddleware";

const router = Router();
import multer from 'multer';

const repository = new adminRepository();
const interactor = new adminInteractor(repository);
const controller = new AdminController(interactor);

const imageStorage = multer.memoryStorage();
const singleImageUpload = multer({ storage: imageStorage })


router.post("/loginAdmin", controller.loginAdmin.bind(controller));
router.post('/register', controller.registerAdmin.bind(controller));
router.get('/userList', controller.getUsers.bind(controller));
router.put('/updateStatus/:userId', controller.updateUserStatus.bind(controller));
router.get('/doctorsList', controller.getDoctors.bind(controller));
router.put('/updateDocStatus/:doctorId', controller.updateDoctorStatus.bind(controller));
router.put('/updateSpecialtyStatus/:specialtyId', controller.updateSpecialtyStatus.bind(controller));
router.get("/viewDoctor/:doctorId", controller.viewDoctor.bind(controller));
router.put('/verifyDoctor/:doctorId', controller.verifyDoctor.bind(controller));
router.get('/specialtyList', controller.getSpecialties.bind(controller));
router.post('/addSpecialty', singleImageUpload.single('specialtyImage'), controller.addSpecialty.bind(controller));
router.delete('/deleteSpecialty/:specialtyId', controller.deleteSpecialty.bind(controller));
router.get("/viewSpecialty/:specialtyId", controller.viewSpecialty.bind(controller));
router.put('/editSpecialty/:specialtyId', singleImageUpload.single('specialtyImage'), controller.editSpecialty.bind(controller));
router.get('/specialtyDocts/:specialtyName', controller.getDoctorsBySpecialty.bind(controller));
router.put('/bookingStatus/:slotId', controller.updateSlotStatus.bind(controller));
router.get('/dashBoardBookings', controller.getBookingsData.bind(controller));
router.post('/submitReport', controller.createReport.bind(controller));
router.get('/reports', controller.getAllReports.bind(controller));
router.put('/updateReportStatus/:reportId', controller.changeReportStatus.bind(controller));


export default router;
