import express, { Router, Request } from 'express';
import { DoctorController } from '../controllers/doctorController';
import { DoctorRepository } from "../repositories/doctorRepository";
import { DoctorInteractor } from "../interactors/doctorInteractor";
import authMiddleWare from "../middleware/doctorAuthMiddleware";

const router = Router();
import multer from 'multer';

const repository = new DoctorRepository();
const interactor = new DoctorInteractor(repository);
const controller = new DoctorController(interactor);

const imageStorage = multer.memoryStorage();
const singleImageUpload = multer({ storage: imageStorage })
const multipleImageUpload = multer({ storage: imageStorage }).array('certificates');//for uploding multiple certificates of doctor.

router.post("/docSignUp", controller.docSignUp.bind(controller));
router.post("/loginDoctor", controller.login.bind(controller));
router.post("/docOtpVerify", controller.docOTPverify.bind(controller));
router.post("/docResendOTP", controller.ResendOTP.bind(controller));
router.post("/docForgPass", controller.forgotPassword.bind(controller));
router.post("/docForgPassVerifyOTP", controller.forgPassVerifyOTP.bind(controller));
router.post("/docResetPass", controller.resetPassWord.bind(controller));
router.get("/docProfile", authMiddleWare, controller.getDoctorDetails.bind(controller));
router.put("/updateDocProfile", authMiddleWare, controller.updateDoctorDetails.bind(controller));
router.post('/uploadProfilePhoto', authMiddleWare, singleImageUpload.single('profileImage'), controller.uploadProfilePhoto.bind(controller));
router.post('/uploadCertificates', authMiddleWare, multipleImageUpload, controller.uploadCertificates.bind(controller));
router.get('/consultationSlots', authMiddleWare, controller.getSlots.bind(controller));
router.post('/addSlots', authMiddleWare, controller.createConsultationSlot.bind(controller));
router.delete('/deleteSlot/:slotId', authMiddleWare, controller.deleteSlot.bind(controller));
router.put('/changeSlotStatus/:slotId', authMiddleWare, controller.updateConsultationSlotStatus.bind(controller));
router.get('/VirtualBookings', authMiddleWare, controller.getBookingsVirtual.bind(controller));
router.get('/fetchUserIdbooking/:bookingId', authMiddleWare, controller.getUserDetailsByBookingId.bind(controller));
router.get('/chatMessages/:senderId/:receiverId', authMiddleWare, controller.getMessages.bind(controller));
router.get("/docDetails/:doctorId",controller.getDoctorDetailsById.bind(controller));
router.post('/uploadPrescription', authMiddleWare, controller.uploadEPrescription.bind(controller));





export default router;