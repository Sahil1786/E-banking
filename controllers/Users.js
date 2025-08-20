
require('dotenv').config();
const exprss=require("express");
const connection = require('../db/db.js');

const md5=require('md5');

const jwt = require("jsonwebtoken");
const { authMiddleware } = require('../middleware/auth.js');

const app=exprss();

const router=exprss.Router();


app.use(exprss.json());










router.post("/login", async (req, res) => {
  try {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      return res.status(400).json({
        message: "Login ID and password are required"
      });
    }

    const hashedPassword = md5(password);


    const [results] = await connection.execute(
      "SELECT * FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid login ID or password" });
    }

    const user = results[0];

 
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: "Invalid login ID or password" });
    }

 
    if (!user.status || user.status.trim().toLowerCase() !== "active") {
      return res.status(403).json({
        message: "Account is inactive. Contact admin."
      });
    }

  
    delete user.password;

   
    const token = jwt.sign(
      { login_id: user.login_id },
      process.env.JWT_SECRET,
      { expiresIn: "10h" }
    );

    return res.status(200).json({
      token,
      user: {
        login_id: user.login_id,
        company_id: user.company_id,
        status: user.status
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});




router.get("/get-details", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;

    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    const [results] = await connection.execute(
      `SELECT id, company_id, login_id, email, role, name, designation, status, create_on, update_on 
       FROM api_dashboard_user 
       WHERE login_id = ?`,
      [login_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: results[0]
    });
  } catch (err) {
    console.error("get-details error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});




// router.get("/cheack-auth", authMiddleware, (req, res) => {
//     return res.status(200).json({
//         // message: "User is authenticated",
//         user: req.userData
//     });
    
// });

// router.get("/get-details/:login_id", authMiddleware, async (req, res) => {
//   try {
//     const login_id = req.params.login_id; 

//     if (!login_id) {
//       return res.status(400).json({ message: "Missing login_id in params" });
//     }

//     const [results] = await connection.execute(
//       `SELECT id, company_id, login_id, email, role, name, designation, status, create_on, update_on 
//        FROM api_dashboard_user 
//        WHERE login_id = ?`,
//       [login_id]
//     );

//     if (results.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       user: results[0],
//     });
//   } catch (err) {
//     console.error("get-details error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

router.get("/cheack-auth", authMiddleware, async (req, res) => {
  try {
    if (!req.userData) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      authenticated: true,
      user: req.userData
    });
  } catch (err) {
    console.error("check-auth error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// router.get("/cheack-auth/:login_id", authMiddleware, async (req, res) => {
//   try {
//     const login_id = req.params.login_id; 

//     if (!login_id) {
//       return res.status(400).json({ message: "Missing login_id in params" });
//     }

//     const [results] = await connection.execute(
//       "SELECT * FROM api_dashboard_user WHERE login_id = ?",
//       [login_id]
//     );

//     if (results.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const user = results[0];

//     return res.status(200).json({
//       message: "User is authenticated",
//       user,
//     });
//   } catch (err) {
//     console.error("cheack-auth error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });






module.exports = router; 