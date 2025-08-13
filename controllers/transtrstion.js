const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");
const { Parser } = require("json2csv"); 

const router = express.Router();


router.get("/wallet-ledger",authMiddleware,  (req, res) => {
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

  
            let sql = `SELECT * FROM api_statement_log WHERE company_id = ?`;
            const params = [company_id];

 
            if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
                sql += ` AND txn_status = ?`;
                params.push(req.query.status.toUpperCase());
            }

        
            if (req.query.start_date && req.query.end_date) {
                sql += ` AND date_time BETWEEN ? AND ?`;
                params.push(req.query.start_date, req.query.end_date);
            }

        
            if (req.query.search) {
                sql += ` AND (order_id LIKE ? OR customer_mobile LIKE ?)`;
                const searchKeyword = `%${req.query.search}%`;
                params.push(searchKeyword, searchKeyword);
            }

            sql += ` ORDER BY date_time DESC`;

           
            connection.query(sql, params, (err, transactions) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });

             
                if (req.query.download && req.query.download.toLowerCase() === "csv") {
                    const json2csvParser = new Parser();
                    const csv = json2csvParser.parse(transactions);

                    res.header("Content-Type", "text/csv");
                    res.attachment(`transactions_${Date.now()}.csv`);
                    return res.send(csv);
                }

            
                return res.status(200).json({
                    message: "Transactions fetched successfully",
                    count: transactions.length,
                    transactions
                });
            });
        }
    );
});

module.exports = router;
