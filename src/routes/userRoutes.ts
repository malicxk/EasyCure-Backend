import { Router } from "express";
import { UserController } from "../controllers/userController";
import { UserRepository } from "../repositories/userRepository";
import { UserInteractor } from "../interactors/UserInteractor";



const router = Router();
import multer from 'multer';
import authenticateUserToken from "../middleware/userAuthMiddleware";

const repository = new UserRepository();
const interactor = new UserInteractor(repository);
const controller = new UserController(interactor);

const imageStorage = multer.memoryStorage();
const singleImageUpload = multer({ storage: imageStorage });

//Routes
router.post("/loginUser", controller.login.bind(controller));
router.post("/signUp", controller.signUp.bind(controller));
router.post("/otpVerify", controller.verifyOTP.bind(controller));
router.post("/resendOtp", controller.ResendOTP.bind(controller));
router.post("/forgotPassword", controller.forgotPassword.bind(controller));
router.post("/forgPassOTPverfiy", controller.forgPassVerifyOTP.bind(controller));
router.post("/resetPassWord", controller.resetPassWord.bind(controller));
router.post('/refresh-token',controller.refreshToken.bind(controller));
//slots functionalities.......
router.get('/getSlotsByDoc/:doctorId', controller.getSlotsByDoctorId.bind(controller));
router.post('/bookSlot', controller.payBookSlot.bind(controller));
router.get('/userProfile/:userId', authenticateUserToken, controller.getUserProfile.bind(controller));
router.post('/uploadProfileImage', singleImageUpload.single('UprofileImage'), controller.uploadProfileImage.bind(controller));
router.post('/uploadMedCertificate', singleImageUpload.single('medicalCertificate'), controller.uploadMedCertificate.bind(controller));
router.put('/editProfile/:userId', controller.updateUser.bind(controller))
router.get('/myBookings/:userId', controller.getMyBookings.bind(controller));
router.get('/doctors', controller.getDoctors.bind(controller));
router.post('/cancelBooking', controller.cancelBooking.bind(controller));
router.post('/walletBook', controller.walletBooking.bind(controller));
router.get('/prescriptionDetails/:patientId', controller.getPrescriptionsByPatientId.bind(controller));
router.get('/downloadPrescription/:prescriptionId', controller.downloadPrescription.bind(controller));
router.post('/patientFeedback/:doctorId', controller.addFeedback.bind(controller));
router.get('/getPatientFeedbacks/:doctorId', controller.getFeedbacksByDoctorId.bind(controller));
router.put('/editFeedback/:feedbackId', controller.updateFeedback.bind(controller));
router.delete('/deleteFeedback/:feedbackId', controller.deleteFeedback.bind(controller));


export default router;