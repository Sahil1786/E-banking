

// require("dotenv").config();
// const jwt = require("jsonwebtoken");
// const connection = require("../db/db.js");

// const authMiddleware = async (req, res, next) => {
//   try {
//     if (!process.env.JWT_SECRET) {
//       return res.status(500).json({ message: "Server configuration error" });
//     }
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ message: "Token missing" });
//     }

    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded || !decoded.login_id) {
//       return res.status(401).json({ message: "Invalid token payload" });
//     }

//     const [results] = await connection.execute(
//       "SELECT * FROM api_dashboard_user WHERE login_id = ?",
//       [decoded.login_id]
//     );

//     if (results.length === 0) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     const user = results[0];


//     if (!user.status || user.status.toLowerCase() !== "active") {
//       return res.status(403).json({ message: "Account is inactive. Contact admin." });
//     }

    
//     req.user = decoded;   
//     req.userData = user;   

//     next();
//   } catch (error) {
//     // console.error(" Auth error:", error.message);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };



require("dotenv").config();
const jwt = require("jsonwebtoken");
const connection = require("../db/db.js");

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

   
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!decoded?.login_id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    
    const [results] = await connection.execute(
      "SELECT * FROM api_dashboard_user WHERE login_id = ?",
      [decoded.login_id]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = results[0];
    if (!user.status || user.status.toLowerCase() !== "active") {
      return res.status(403).json({ message: "Account is inactive. Contact admin." });
    }

    req.user = decoded;   
    req.userData = user; 

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

module.exports = { authMiddleware };
