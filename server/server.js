import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();

  app.use(express.json());
  app.use(cors());
  app.use(clerkMiddleware());

  //API ROUTES
  app.get("/", (req, res) => {
    res.send("Hello from the server!");
  });

  app.use("/api/inngest", serve({ client: inngest, functions }));

  app.use("/api/show",showRouter);
  app.use("/api/booking",bookingRouter)
  app.use('/api/admin',adminRouter);
  app.use("/api/user", userRouter);

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
