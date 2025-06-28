import { clerkClient } from "@clerk/express";
import Booking from "../models/booking.js";
import Movie from "../models/Movie.js";

export const getuserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;
    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
      user.privateMetadata.favorites.push(movieId);
    } else {
      user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
        (id) => id !== movieId
      );
    }

    await clerkClient.users.updateUser(userId, {
      privateMetadata: user.privateMetadata,
    });

    res.json({ success: true, message: "Favorite updated successfully" });
  } catch (error) {
    console.error("Error updating favorite:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Fetch all favorite movies
export const getFavorites = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites || [];

    const movies = await Movie.find({ _id: { $in: favorites } });
    res.json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
