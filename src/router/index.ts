import express, { Router } from 'express';

import * as schema from '../validators';

import { validate } from '../middleware/validation-middleware';
import { authentication } from '../middleware/authentication-middleware';
import { onlyAdminRoute } from '../middleware/only-admin-middleware';
import { upload } from '../middleware/upload-middleware';

import * as authController from '../controllers/auth';
import * as socialLoginController from '../controllers/social-login';
import * as profileController from '../controllers/profile';
import * as mulchRequestController from '../controllers/mulch-requests';
import * as workItemController from '../controllers/work-items';
import * as estimateController from '../controllers/estimates';
import * as invoiceController from '../controllers/invoice';

const router: Router = express.Router();
const adminRouter: Router = express.Router();

/* AUTH ROUTES */

router.post('/signup', validate(schema.signupSchema), authController.signup);
router.post('/signin', validate(schema.signinSchema), authController.signin);
router.get('/verify-token', socialLoginController.verifyToken);
router.get('/me', authentication, authController.me);

/* PROFILE ROUTES */

router.patch('/profile', upload.single('photo'), validate(schema.updateUserSchema), authentication, profileController.updateProfile);
router.patch('/password', validate(schema.changePasswordSchema), authentication, profileController.changePassword);
router.post('/address', validate(schema.newAddressSchema), authentication, profileController.addNewAddress);
router.patch('/make-address-default/:id', authentication, profileController.makeAddressDefault);
router.delete('/address/:id', authentication, profileController.deleteAddress);

/* MULCH REQUEST ROUTES */

router.get('/mulch-requests/admin', authentication, onlyAdminRoute, mulchRequestController.getAll);
router.get('/mulch-requests', authentication, mulchRequestController.getUserRequest);
router.get('/mulch-request/:id', authentication, mulchRequestController.getById);
router.post('/mulch-request', authentication, upload.single('photo'), validate(schema.mulchRequestSchema), mulchRequestController.create);
router.put('/mulch-request', authentication, upload.single('photo'), validate(schema.mulchRequestSchema), mulchRequestController.update);
router.patch('/mulch-request/status', authentication, mulchRequestController.changeStatus);
router.delete('/mulch-request/:id', authentication, mulchRequestController.deleteMulchRequest);

/* WORK ITEM ROUTES */

router.post('/work-item/images', authentication, upload.array('image'), workItemController.uploadImages);
router.get('/work-item/:id', authentication, workItemController.getWorkItemById);
router.post('/work-item', authentication, validate(schema.workItemSchema), workItemController.createWokItem);
router.put('/work-item', authentication, validate(schema.workItemSchema), workItemController.updateWorkItem);
router.delete('/work-item/:id', authentication, workItemController.deleteWorkItem);

/* ESTIMATE ROUTES */

router.get('/estimate/:id', authentication, estimateController.getEstimateById);
router.get('/estimate/user', authentication, estimateController.getUserEstimates);
router.post('/estimate/user', authentication, estimateController.userEstimate);
router.patch('/estimate/user', authentication, estimateController.userEstimate);
router.get('/estimate/admin', authentication, onlyAdminRoute, estimateController.getAdminEstimates);
router.post('/estimate/admin', authentication, onlyAdminRoute, validate(schema.estimateSchema), estimateController.adminEstimate);
router.put('/estimate/admin', authentication, onlyAdminRoute, validate(schema.estimateSchema), estimateController.adminEstimate);
router.patch('/estimate/update-status/:id/:status', authentication, onlyAdminRoute, estimateController.updateEstimateStatus);
router.delete('/estimate/:id', authentication, estimateController.deleteEstimate);

router.get('/send-invoice/:estimateId', authentication, onlyAdminRoute, invoiceController.sendInvoice);

export default router;
export { adminRouter };
