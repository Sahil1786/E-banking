const express = require("express");
const router = express.Router();
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth.js");


router.post("/entity-callback", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    const [userResult] = await connection.execute(
      "SELECT company_id AS corp_id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const corp_id = userResult[0].corp_id;
    const { callback_event_name, callback_url, status } = req.body;

    if (!callback_event_name || !callback_url || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
      INSERT INTO entiity_callback_master 
        (corp_id, callback_event_name, callback_url, status, create_on) 
      VALUES (?, ?, ?, ?, NOW())
    `;

    const [result] = await connection.execute(sql, [
      corp_id,
      callback_event_name,
      callback_url,
      status,
    ]);

    return res.status(201).json({

      id: result.insertId,
      data: { corp_id, callback_event_name, callback_url, status },
    });
  } catch (err) {
    console.error("entity-callback POST error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}).get("/entity-callback", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    
    const [userResult] = await connection.execute(
      "SELECT company_id AS corp_id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const corp_id = userResult[0].corp_id;

    const sql = `
      SELECT id, corp_id, callback_event_name, callback_url, status, create_on
      FROM entiity_callback_master
      WHERE corp_id = ?
      ORDER BY create_on DESC
    `;

    const [results] = await connection.execute(sql, [corp_id]);

    return res.status(200).json({
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error("entity-callback GET error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});









module.exports = router;
