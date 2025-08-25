
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
      token
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
})


router.put("/update-details", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;

    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    const { email, role, name, designation, status } = req.body;

 
    const updates = {};
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (name) updates.name = name;
    if (designation) updates.designation = designation;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }


    const setClause = Object.keys(updates)
      .map(field => `${field} = ?`)
      .join(", ");

    const values = [...Object.values(updates), login_id];

    const sql = `UPDATE api_dashboard_user SET ${setClause}, update_on = NOW() WHERE login_id = ?`;

    const [result] = await connection.execute(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }

    return res.status(200).json({
      message: "User details updated successfully"
    });
  } catch (err) {
    console.error("update-details error:", err);
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

router.get("/check-auth", authMiddleware, async (req, res) => {
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




// router.put("/forgot-password",authMiddleware, async (req, res) => {
//   try {
//     const { login_id, new_password } = req.body;

//     if (!login_id || !new_password) {
//       return res.status(400).json({
//         message: "Login ID and new password are required"
//       });
//     }


//     const [results] = await connection.execute(
//       "SELECT * FROM api_dashboard_user WHERE login_id = ?",
//       [login_id]
//     );

//     if (results.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }


//     const hashedPassword = md5(new_password);

  
//     const [updateResult] = await connection.execute(
//       "UPDATE api_dashboard_user SET password = ?, update_on = NOW() WHERE login_id = ?",
//       [hashedPassword, login_id]
//     );

//     if (updateResult.affectedRows === 0) {
//       return res.status(500).json({ message: "Password reset failed" });
//     }

//     return res.status(200).json({
//       message: "Password reset successful"
//     });

//   } catch (err) {
//     console.error("Forgot Password error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });



router.put("/forgot-password", authMiddleware, async (req, res) => {
  try {

    const login_id =req.use?.login_id
    const {  new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        message: "new password are required"
      });
    }

  
    const [results] = await connection.execute(
      "SELECT id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }


    const hashedPassword = md5(new_password);

   
    const [updateResult] = await connection.execute(
      "UPDATE api_dashboard_user SET password = ?, update_on = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') WHERE login_id = ?",
      [hashedPassword, login_id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ message: "Password reset failed" });
    }

    return res.status(200).json({
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("Forgot Password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router; 