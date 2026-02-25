import express from "express";
import { db } from "../lib/mysql.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

//
// ⭐ CREATE OR UPDATE RATING
//
router.post("/", verifyToken, async (req, res) => {
  const userId = req.userId;
  const { postId, rating } = req.body;

  if (!postId || !rating) {
    return res.status(400).json({ message: "Missing data" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Invalid rating value" });
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

    res.status(200).json({ message: "Rating saved successfully" });
  } catch (err) {
    console.log("POST /ratings error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

//
// ⭐ GET AVERAGE + USER RATING
//
router.get("/:postId", verifyToken, async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId;

  try {
    // ⭐ Get average rating + total reviews
    const [avgRows] = await db.query(
      `
      SELECT 
        AVG(rating) as avgRating, 
        COUNT(*) as total
      FROM ratings
      WHERE postId = ?
      `,
      [postId]
    );

    // ⭐ Get current user's rating
    const [userRows] = await db.query(
      `
      SELECT rating 
      FROM ratings
      WHERE postId = ? AND userId = ?
      `,
      [postId, userId]
    );

    res.status(200).json({
      avgRating: avgRows[0].avgRating || 0,
      total: avgRows[0].total || 0,
      userRating: userRows.length > 0 ? userRows[0].rating : 0,
    });
  } catch (err) {
    console.log("GET /ratings/:postId error:", err);
    res.status(500).json({ message: "Error fetching ratings" });
  }
});

export default router;