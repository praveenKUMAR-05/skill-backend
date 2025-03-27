import express from "express";
import Skill from "../models/Skill.js"; // Ensure correct model path

const router = express.Router();

/**
 * @route   GET /api/skills
 * @desc    Fetch all skills
 * @access  Public
 */
router.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

/**
 * @route   POST /api/add-skill
 * @desc    Add a new skill
 * @access  Public
 */
router.post("/add-skill", async (req, res) => {
  try {
    const { name, category, level, description } = req.body;

    // Validate input
    if (!name || !category || level === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new skill document
    const newSkill = new Skill({ name, category, level, description });

    // Save to database
    await newSkill.save();

    res.status(201).json({ message: "Skill added successfully", skill: newSkill });
  } catch (error) {
    console.error("Error adding skill:", error);
    res.status(500).json({ error: "Failed to add skill" });
  }
});

/**
 * @route   PUT /api/update-skill/:id
 * @desc    Update a skill
 * @access  Public
 */
router.put("/update-skill/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, level, description } = req.body;

    // Validate input
    if (!name || !category || level === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      { name, category, level, description, lastUpdated: new Date() },
      { new: true } // Return updated document
    );

    if (!updatedSkill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ message: "Skill updated successfully", skill: updatedSkill });
  } catch (error) {
    console.error("Error updating skill:", error);
    res.status(500).json({ error: "Failed to update skill" });
  }
});

/**
 * @route   DELETE /api/delete-skill/:id
 * @desc    Delete a skill
 * @access  Public
 */
router.delete("/delete-skill/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSkill = await Skill.findByIdAndDelete(id);

    if (!deletedSkill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});

export default router;
