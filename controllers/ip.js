const express = require("express");
const router = express.Router();
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");
const axios = require("axios");

const ipLib = require("ip");



const app = express();

app.set("trust proxy", true); 

router.post("/login-attempts", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) return res.status(401).json({ message: "Unauthorized" });

    let clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress;

    clientIp = clientIp.replace("::ffff:", "");

    if (clientIp === "127.0.0.1" || clientIp === "::1") {
      clientIp = ipLib.address();
    }



    const attempted_at = new Date();

    await connection.execute(
      "INSERT INTO api_login_attempts (user_id, ip_address, attempted_at) VALUES (?, ?, ?)",
      [login_id, clientIp, attempted_at]
    );

    return res.status(201).json({
      message: "Login attempt recorded successfully",
      login_id,
      ip_address: clientIp,
    });
  } catch (err) {
    console.error("login-attempts error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}).get("/login-attempts", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

 
    const [attempts] = await connection.execute(
      "SELECT * FROM api_login_attempts WHERE user_id = ? ORDER BY attempted_at DESC",
      [login_id]
    );

    return res.status(200).json({
      count: attempts.length,
      attempts,
    });
  } catch (err) {
    console.error("login-attempts error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
