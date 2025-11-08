import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import visitorRoutes from "./routes/visitorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import msgRoutes from "./routes/msgRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import client from "./config/database.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://shajidint.vercel.app",
      "https://shajidint.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/msgs", msgRoutes);
app.use("/visitors", visitorRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`Server running on port ${port}`));
