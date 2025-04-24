import express from 'express';
import passport from '../middlewares/passport.js';
import validator from '../middlewares/validator.js';
import accountExistsSignUp from '../middlewares/accountSignUp.js';
import accountExistsSignIn from '../middlewares/accountSignIn.js';
import verifyCurrentPassword from '../middlewares/verifyCurrentPassword.js';
import passwordIsOk from '../middlewares/passwordIsOk.js';
import {isAdmin, isOwnerOrAdmin} from '../middlewares/isAdmin.js';
import accountHasBeenVerified from '../middlewares/isVerified.js'
import signUp from '../controllers/users/signUp.js';
import signIn from '../controllers/users/signIn.js';
import signOut from '../controllers/users/signOut.js';
import userIsVerified from '../controllers/users/isVerified.js';
import resetPassword from '../controllers/users/resetPassword.js';
import forgotPassword from '../controllers/users/forgotPassword.js';
import reSend from '../controllers/users/reSendEmail.js';
import createAdmin from '../controllers/users/createAdmin.js';
import updateUser from '../controllers/users/updateUser.js';
import adminConvert from '../controllers/users/adminConvert.js';
import createCustomer from '../controllers/users/createCustomer.js';

import { deleteUser, deleteUsers } from '../controllers/users/deleteUsers.js';
import getMyData from '../controllers/users/getMyData.js';
import { getOneUser, getUsers, getTotalCustomers, getCustomer } from '../controllers/users/getUsers.js';
import { userSignUp } from '../schemas/users.js';
import  savePushToken  from '../controllers/users/savePushToken.js';

const router = express.Router();

// Authentication Routes
router.post('/signup', accountExistsSignUp,
    //  validator(userSignUp)
      signUp);
router.post('/signin', accountExistsSignIn, passwordIsOk, accountHasBeenVerified, signIn);
router.post('/signout', passport.authenticate('jwt', { session: false }), signOut);

// User Verification Routes
router.post('/verify/resend_code', reSend);
router.patch('/verify/:verify_code', userIsVerified);

// Password Management Routes
router.post('/reset_password', passport.authenticate('jwt', { session: false }), verifyCurrentPassword, resetPassword);
router.post('/forgot_password', forgotPassword);
router.post('/recover_password', passport.authenticate('jwt', { session: false }), resetPassword);

// User Management Routes
router.get('/me', passport.authenticate('jwt', { session: false }), getMyData);
router.patch('/update', passport.authenticate('jwt', { session: false }), updateUser);
router.get('/', passport.authenticate('jwt', { session: false }), isAdmin, getUsers);
router.get('/total-customers', passport.authenticate('jwt', { session: false }), isAdmin, getTotalCustomers);
router.get('/get-one-user', passport.authenticate('jwt', { session: false }), isAdmin, getOneUser);
router.get('/:id', passport.authenticate('jwt', { session: false }), isAdmin, getCustomer);
router.post('/save_push_token', passport.authenticate('jwt', { session: false }), savePushToken);
// Admin Management Routes
router.post('/create-customer', passport.authenticate('jwt', { session: false }), isAdmin, accountExistsSignUp, createCustomer);
router.post('/:id', passport.authenticate('jwt', { session: false }), isAdmin, adminConvert);

// User Deletion Routes
router.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, deleteUser);
router.delete('/delete-account/:id', passport.authenticate('jwt', { session: false }), isOwnerOrAdmin, deleteUser);
router.delete('/', passport.authenticate('jwt', { session: false }), isAdmin, deleteUsers);

export default router;
