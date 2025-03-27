import { config } from "dotenv";
import express from "express";
import { genSalt, hash, compare } from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
const { sign, verify } = jsonwebtoken;
import cors from "cors";
import { connect, Schema, model } from "mongoose";
import Skill from "../models/Skill.js";

config();

const app = express();
const router = express.Router(); // ✅ FIX: Define router

app.use(cors());
app.use(express.json());

// Database connection
connect(process.env.MONGODB_URI || "mongodb://localhost:27017/skilltracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User model
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = model("User", UserSchema);

// Registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email already exists" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    const user = new User({ name, email, password: hashedPassword });

    await user.save();

    const token = sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.status(201).json({ message: "User registered successfully", token, user: { id: user._id, name, email } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Middleware for authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Protected dashboard route
app.get("/api/dashboard", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to your dashboard", user: req.user });
});

// Skills routes
router.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

router.post("/add-skill", async (req, res) => {
  try {
    const { name, category, level, description } = req.body;
    if (!name || !category || level === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newSkill = new Skill({ name, category, level, description });
    await newSkill.save();

    res.status(201).json({ message: "Skill added successfully", skill: newSkill });
  } catch (error) {
    console.error("Error adding skill:", error);
    res.status(500).json({ error: "Failed to add skill" });
  }
});

router.put("/update-skill/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, level, description } = req.body;
    if (!name || !category || level === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(id, { name, category, level, description }, { new: true });
    if (!updatedSkill) return res.status(404).json({ error: "Skill not found" });

    res.json({ message: "Skill updated successfully", skill: updatedSkill });
  } catch (error) {
    console.error("Error updating skill:", error);
    res.status(500).json({ error: "Failed to update skill" });
  }
});

router.delete("/delete-skill/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSkill = await Skill.findByIdAndDelete(id);
    if (!deletedSkill) return res.status(404).json({ error: "Skill not found" });

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

// Use router for skills
app.use("/api", router);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
