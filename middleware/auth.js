// require("dotenv").config();

// const jwt = require("jsonwebtoken");
// const connection = require("../db/db.js");


// const JWT_SECRET="sahil1234";

// const authMiddleware = (req, res, next) => {
//     const authHeader = req.headers["authorization"];

    
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({ message: "No token provided in header" });
//     }

//     const token = authHeader.split(" ")[1]; 
//     if (!token) {
//         return res.status(401).json({ message: "Token missing in header" });
//     }

//     try {
      
//         const decoded = jwt.verify(token,JWT_SECRET);

    
//         connection.query(
//             "SELECT * FROM api_dashboard_user WHERE login_id = ?",
//             [decoded.login_id],
//             (err, results) => {
//                 if (err) {
//                     console.error("DB Error:", err);
//                     return res.status(500).json({ message: "Database error" });
//                 }
//                 if (results.length === 0) {
//                     return res.status(401).json({ message: "User not found" });
//                 }

//                 const user = results[0];

             
//                 if (user.status.toLowerCase() !== "active") {
//                     return res.status(403).json({ message: "Account is inactive. Contact admin." });
//                 }

           
//                 req.user = decoded; 
//                 req.userData = user;

//                 next(); 
//             }
//         );

//     } catch (error) {
//         console.error("JWT verification error:", error.message);
//         return res.status(401).json({ message: "Invalid or expired token" });
//     }
// };

// module.exports = { authMiddleware };



require("dotenv").config();
const jwt = require("jsonwebtoken");
const connection = require("../db/db.js");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    connection.query(
      "SELECT * FROM api_dashboard_user WHERE login_id = ?",
      [decoded.login_id],
      (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(401).json({ message: "User not found" });

        const user = results[0];
        if (user.status.toLowerCase() !== "active") {
          return res.status(403).json({ message: "Account is inactive. Contact admin." });
        }

        req.user = decoded;
        req.userData = user;
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware };
