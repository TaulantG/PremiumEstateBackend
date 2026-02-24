import express from "express";
import { db } from "../lib/mysql.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

//
// ⭐ CREATE / UPDATE RATING
//
router.post("/", verifyToken, async (req, res) => {
  const userId = req.userId;
  const { postId, rating } = req.body;

  if (!postId || !rating) {
    return res.status(400).json({ message: "Missing data" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating" });
  }

  try {
    await db.query(
      `
      INSERT INTO ratings (userId, postId, rating)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE rating = ?
      `,
      [userId, postId, rating, rating]
    );

    res.status(200).json({ message: "Rating saved" });
  } catch (err) {
    res.status(500).json({ message: "Error saving rating" });
  }
});

//
// ⭐ GET AVERAGE RATING
//
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT AVG(rating) as avgRating, COUNT(*) as total
      FROM ratings
      WHERE postId = ?
      `,
      [postId]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching ratings" });
  }
});

export default router;