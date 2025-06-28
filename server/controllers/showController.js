import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// Helper to fetch from TMDB with retry
const fetchWithRetry = async (url, headers, retries = 1) => {
  try {
    return await axios.get(url, { headers, timeout: 5000 });
  } catch (err) {
    if (
      retries > 0 &&
      (err.code === "ECONNRESET" || err.code === "ETIMEDOUT")
    ) {
      console.warn(`Retrying TMDB fetch: ${url}`);
      return await fetchWithRetry(url, headers, retries - 1);
    }
    throw err;
  }
};

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    };

    const { data } = await fetchWithRetry(
      "https://api.themoviedb.org/3/movie/now_playing",
      headers
    );

    const movies = data.results || [];
    res.json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching now playing movies:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch movies. Please try again.",
      });
  }
};

// API to add a new show to the database
export const addShow = async (req, res) => {
  console.log("Incoming request:", req.body);

  try {
    const { movieId, showsInput, showPrice } = req.body;

    let movie = await Movie.findById(movieId);
    const headers = {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    };

    if (!movie) {
      const [detailsRes, creditsRes] = await Promise.all([
        fetchWithRetry(
          `https://api.themoviedb.org/3/movie/${movieId}`,
          headers
        ),
        fetchWithRetry(
          `https://api.themoviedb.org/3/movie/${movieId}/credits`,
          headers
        ),
      ]);

      const movieData = detailsRes.data;
      const credits = creditsRes.data;

      movie = await Movie.create({
        _id: movieId,
        title: movieData.title,
        overview: movieData.overview,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        genres: movieData.genres,
        casts: credits.cast,
        release_date: movieData.release_date,
        original_language: movieData.original_language,
        tagline: movieData.tagline || "",
        vote_average: movieData.vote_average,
        runtime: movieData.runtime || 0,
      });
    }

    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice: showPrice,
          occupiedSeats: {},
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
      res.json({ success: true, message: "Shows added successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "No show times provided" });
    }
  } catch (error) {
    console.error("Error in addShow:", error.message);
    res.status(500).json({ success: false, message: "Error adding shows" });
  }
};

// API to get all upcoming shows
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    const uniqueMoviesMap = new Map();
    shows.forEach((show) => {
      if (!uniqueMoviesMap.has(show.movie._id.toString())) {
        uniqueMoviesMap.set(show.movie._id.toString(), show.movie);
      }
    });

    res.json({ success: true, shows: Array.from(uniqueMoviesMap.values()) });
  } catch (error) {
    console.error("Error fetching shows:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch shows" });
  }
};

// API to get show info by movieId
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error("Error fetching show:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch show details" });
  }
};
