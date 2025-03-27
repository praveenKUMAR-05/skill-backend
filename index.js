import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import skillRoutes from "./routes/skillRoutes.js";
import authRoutes from "./routes/auth.js";
import api from "./api/api.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("Skill Tracker API is running...");
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api", skillRoutes);
app.use("/api/auth", authRoutes);


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
