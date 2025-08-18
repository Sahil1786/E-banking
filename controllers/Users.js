
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
    const { login_id, password } = req.body;

    if (!login_id || !password) {
        return res.status(400).json({
            message: "Login ID and password are required"
        });
    }

    const hashedPassword = md5(password);

 connection.query(
        "SELECT * FROM api_dashboard_user WHERE login_id = ?",
        [login_id],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid login ID or password"
                });
            }

            const user = results[0];

            if (user.password !== hashedPassword) {
                return res.status(401).json({
                    message: "Invalid login ID or password"
                });
            }

        const isActive = user.status.toLowerCase() == "active" || user.status=="Active" || user.status=="ACTIVE"|| user.status=="active";
            if (user.status== isActive) {
                return res.status(403).json({
                    message: "Account is inactive. Contact admin."
                });
            }

            //        if (user.status.toLowerCase() !== "active") {
            //     return res.status(403).json({
            //         message: "Account is inactive. Contact admin."
            //     });
            // }


            delete user.password;

            
            const token = jwt.sign(
                { login_id: user.login_id },
               process.env.JWT_SECRET,                  
                { expiresIn: "1h" }          
            );

            return res.status(200).json({
                message: "Login successful",
                token
            });
        }
    );
});

router.get("/get-details", authMiddleware, (req, res) => {
    const login_id = req.user?.login_id;

    if (!login_id) {
        return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    connection.query(
        "SELECT id, company_id, login_id, email, role, name, designation, status, create_on, update_on FROM api_dashboard_user WHERE login_id = ?",
        [login_id],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (results.length === 0) return res.status(404).json({ message: "User not found" });

            return res.status(200).json({
                message: "User details fetched successfully",
                user: results[0]
            });
        }
    );
});

module.exports = router;




router.get("cheack-auth", authMiddleware, (req, res) => {
    return res.status(200).json({
        message: "User is authenticated",
        user: req.userData
    });
});






module.exports = router; // Export the router for use in other files