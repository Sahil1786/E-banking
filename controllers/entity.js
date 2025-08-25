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

   
       corp_id, 
       callback_event_name,
        callback_url, 
        status }
    );

  
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
      ORDER BY create_on ASC
    `;

    const [results] = await connection.execute(sql, [corp_id]);

    return res.status(200).json(results);
  } catch (err) {
    console.error("entity-callback GET error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}).put("/entity-callback:corp_id/:callback_event_name/:status", authMiddleware, async (req, res) => {
  try {
    let { corp_id, callback_event_name, status } = req.params;

    corp_id = corp_id?.trim();
    callback_event_name = callback_event_name?.trim();
    status = status?.trim();

    if (!corp_id || !callback_event_name || !status) {
      return res.status(400).json({ message: "corp_id, callback_event_name, and status are required" });
    }

    const sql = `
      UPDATE entiity_callback_master
      SET status = ?, update_on = NOW()
      WHERE LOWER(corp_id) = LOWER(?) 
        AND LOWER(callback_event_name) = LOWER(?)
    `;

    const [result] = await connection.execute(sql, [status, corp_id, callback_event_name]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No matching rows found" });
    }

    return res.status(200).json({
      message: "Row(s) updated successfully",
      updatedRows: result.affectedRows
    });
  } catch (err) {
    console.error("entity-callback UPDATE error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}).delete("/entity-callback/:corp_id/:callback_event_name", authMiddleware, async (req, res) => {
  try {
    let { corp_id, callback_event_name } = req.params;

    corp_id = corp_id?.trim();
    callback_event_name = callback_event_name?.trim();

    if (!corp_id || !callback_event_name) {
      return res.status(400).json({ message: "Both corp_id and callback_event_name are required" });
    }

    const sql = `
      DELETE FROM entiity_callback_master
      WHERE corp_id = ?
        AND callback_event_name = LOWER(?)
    `;

    const [result] = await connection.execute(sql, [corp_id, callback_event_name]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No matching rows found" });
    }

    return res.status(200).json(
      result.affectedRows
     
    );

  } catch (err) {
    console.error("entity-callback DELETE error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});




module.exports = router;
