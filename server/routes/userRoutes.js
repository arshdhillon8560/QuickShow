import express from 'express';
import { getFavorites, getuserBookings, updateFavorite } from '../controllers/userController.js';

const userRouter =express.Router();

userRouter.get('/bookings',getuserBookings)
userRouter.post('/update-favorite',updateFavorite);
userRouter.get('/favorites',getFavorites);

export default userRouter;