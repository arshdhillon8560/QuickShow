import Booking from "../models/booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import Movie from "../models/Movie.js";

export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).sort({ showDateTime: 1 });

    const movieIds = [...new Set(shows.map((show) => show.movie.toString()))];
    const movies = await Movie.find({ _id: { $in: movieIds } });

    const movieMap = {};
    movies.forEach((m) => {
      movieMap[m._id.toString()] = m;
    });

    const activeShows = shows.map((s) => ({
      ...s.toObject(),
      movie: movieMap[s.movie.toString()] || null,
    }));

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, b) => acc + b.amount, 0),
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard data" });
  }
};

export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).sort({ showDateTime: 1 });

    const movieIds = [...new Set(shows.map((s) => s.movie.toString()))];
    const movies = await Movie.find({ _id: { $in: movieIds } });

    const movieMap = {};
    movies.forEach((m) => {
      movieMap[m._id.toString()] = m;
    });

    const completeShows = shows.map((s) => ({
      ...s.toObject(),
      movie: movieMap[s.movie.toString()] || null,
    }));

    res.json({ success: true, shows: completeShows });
  } catch (error) {
    console.error("Error fetching shows:", error);
    res.status(500).json({ success: false, message: "Error fetching all shows" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate({
        path: 'show',
        populate: { path: 'movie' },
      })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ success: false, message: "Error fetching bookings" });
  }
};
