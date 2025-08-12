

const exprss=require("express");
const connection = require('../db/db.js');

const md5=require('md5');



const app=exprss();

const router=exprss.Router();


app.use(exprss.json());





// Constant token for successful login





router.post("/login", (req, res) => {
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

            if (user.status.toLowerCase() !== "active") {
                return res.status(403).json({
                    message: "Account is inactive. Contact admin."
                });
            }

           const TEST_TOKEN = "MY_STATIC_TOKEN_12345";
            delete user.password;

            return res.status(200).json({
                message: "Login successful",
                token: TEST_TOKEN,
                user
            });
        }
    );
});


module.exports = router; // Export the router for use in other files