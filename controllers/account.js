

const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();


router.get("/fund-requests", authMiddleware, (req, res) => {
    const login_id = req.user?.login_id;

    if (!login_id) {
        return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    
    connection.query(
        "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
        [login_id],
        (err, userResults) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (userResults.length === 0) return res.status(404).json({ message: "User not found" });

            const company_id = userResults[0].company_id;

            
            connection.query(
                "SELECT * FROM api_fund_request WHERE company_id = ? ORDER BY create_on DESC",
                [company_id],
                (err, fundRequests) => {
                    if (err) return res.status(500).json({ message: "Database error", error: err });

                    return res.status(200).json({
                        message: "Fund requests fetched successfully",
                        count: fundRequests.length,
                        fundRequests
                    });
                }
            );
        }
    );
});



router.get("/entity-settlement-account", authMiddleware, (req, res) => {
    const login_id = req.user?.login_id;

    if (!login_id) {
        return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

   
    connection.query(
        "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
        [login_id],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (results.length === 0) return res.status(404).json({ message: "User not found" });

            const company_id = results[0].company_id;

         
            const sql = `SELECT * FROM entity_settlement_account WHERE company_id = ? ORDER BY create_on DESC`;
            connection.query(sql, [company_id], (err, accounts) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });

                return res.status(200).json({
                    message: "Settlement accounts fetched successfully",
                    count: accounts.length,
                    accounts
                });
            });
        }
    );
});

module.exports = router;
