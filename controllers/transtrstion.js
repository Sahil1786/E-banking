

// const express = require("express");
// const connection = require("../db/db.js");
// const { authMiddleware } = require("../middleware/auth");
// const PDFDocument = require("pdfkit");

// const router = express.Router();

// router.get("/wallet-ledger", authMiddleware, (req, res) => {
//   const login_id = req.user?.login_id;
//   if (!login_id) return res.status(401).json({ message: "Unauthorized" });

//   connection.query(
//     "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
//     [login_id],
//     (err, results) => {
//       if (err) return res.status(500).json({ message: "Database error", error: err });
//       if (results.length === 0) return res.status(404).json({ message: "User not found" });

//       const company_id = results[0].company_id;

//       // Base SQL
//       let sql = `SELECT * FROM api_statement_log WHERE company_id = ?`;
//       const params = [company_id];

//       // Status filter
//       if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
//         sql += " AND txn_status = ?";
//         params.push(req.query.status.toUpperCase());
//       }

//       // Date range filter
//       if (req.query.start_date && req.query.end_date) {
//         sql += " AND date_time BETWEEN ? AND ?";
//         params.push(req.query.start_date + " 00:00:00", req.query.end_date + " 23:59:59");
//       }

//       // Search filter
//       if (req.query.search) {
//         sql += " AND (order_id LIKE ? OR customer_mobile LIKE ?)";
//         const searchKeyword = `%${req.query.search}%`;
//         params.push(searchKeyword, searchKeyword);
//       }

//       sql += " ORDER BY date_time DESC";

//       connection.query(sql, params, (err, transactions) => {
//         if (err) return res.status(500).json({ message: "Database error", error: err });

//         // PDF download
//         if (req.query.download && req.query.download.toLowerCase() === "pdf") {
//           const doc = new PDFDocument({ margin: 30, size: "A4" });
//           res.setHeader("Content-Disposition", `attachment; filename=transactions_${Date.now()}.pdf`);
//           res.setHeader("Content-Type", "application/pdf");
//           doc.pipe(res);

//           doc.fontSize(16).text("Transaction Report", { align: "center" });
//           doc.moveDown();

//           transactions.forEach((t, index) => {
//             doc.fontSize(12).text(
//               `${index + 1}. Order ID: ${t.order_id}, Customer: ${t.customer_mobile || t.customer_name || "-"}, Amount: ${t.txn_amount}, Status: ${t.txn_status}, Date: ${t.date_time}`
//             );
//             doc.moveDown(0.5);
//           });

//           doc.end();
//           return;
//         }

//         // JSON response
//         return res.status(200).json({
//           message: "Transactions fetched successfully",
//           count: transactions.length,
//           transactions,
//         });
//       });
//     }
//   );
// });

// module.exports = router;


const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");
const ExcelJS = require("exceljs");

const router = express.Router();

router.get("/wallet-ledger", authMiddleware, (req, res) => {
  const login_id = req.user?.login_id;
  if (!login_id) return res.status(401).json({ message: "Unauthorized" });

  connection.query(
    "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
    [login_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });

      const company_id = results[0].company_id;

      // Build SQL dynamically
      let sql = `SELECT * FROM api_statement_log WHERE company_id = ?`;
      const params = [company_id];

      if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
        sql += " AND txn_status = ?";
        params.push(req.query.status.toUpperCase());
      }

      if (req.query.start_date && req.query.end_date) {
        sql += " AND date_time BETWEEN ? AND ?";
        params.push(req.query.start_date + " 00:00:00", req.query.end_date + " 23:59:59");
      }

      if (req.query.search) {
        sql += " AND (order_id LIKE ? OR customer_mobile LIKE ?)";
        const searchKeyword = `%${req.query.search}%`;
        params.push(searchKeyword, searchKeyword);
      }

      sql += " ORDER BY date_time DESC";

      connection.query(sql, params, async (err, transactions) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        // Excel download
        if (req.query.download && req.query.download.toLowerCase() === "") {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet("Transactions");

          // Add header row
          worksheet.columns = [
            { header: "S.No", key: "s_no", width: 5 },
            { header: "Order ID", key: "order_id", width: 25 },
            { header: "Customer Mobile", key: "customer_mobile", width: 20 },
            { header: "Amount", key: "txn_amount", width: 15 },
            { header: "Status", key: "txn_status", width: 15 },
            { header: "Date", key: "date_time", width: 20 },
            { header: "Remark", key: "remark", width: 30 },
          ];

          // Add data rows
          transactions.forEach((t, index) => {
            worksheet.addRow({
              s_no: index + 1,
              order_id: t.order_id,
              customer_mobile: t.customer_mobile || "-",
              txn_amount: t.txn_amount,
              txn_status: t.txn_status,
              date_time: t.date_time,
              remark: t.remark || "-",
            });
          });

          res.setHeader(
            "Content-Disposition",
            `attachment; filename=transactions_${Date.now()}.xlsx`
          );
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          await workbook.xlsx.write(res);
          res.end();
          return;
        }

        // JSON response
        return res.status(200).json({
          message: "Transactions fetched successfully",
          count: transactions.length,
          transactions,
        });
      });
    }
  );
});




router.get("/payouts", authMiddleware, (req, res) => {
    const loginId = req.user.login_id;

    const companyQuery = "SELECT company_id FROM api_dashboard_user WHERE login_id = ?";
    connection.query(companyQuery, [loginId], (err, companyResult) => {
        if (err) return res.status(500).json({ error: "DB query failed" });
        if (companyResult.length === 0) return res.status(404).json({ message: "User not found" });

        const companyId = companyResult[0].company_id;

        // If "report=true" is passed → return summary
        if (req.query.report && req.query.report.toLowerCase() === "true") {
            const sql = `
                SELECT 
                    u.login_id,
                    u.company_id,
                    COUNT(p.id) AS total_payouts,

                    SUM(CAST(p.settlement_amount AS DECIMAL(15,2))) AS total_payout_value,

                    SUM(CASE WHEN p.status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
                    SUM(CASE WHEN p.status = 'SUCCESS' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS success_value,

                    SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
                    SUM(CASE WHEN p.status = 'PENDING' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS pending_value,

                    SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
                    SUM(CASE WHEN p.status = 'FAILED' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS failed_value,

                    ROUND(
                        (SUM(CASE WHEN p.status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(p.id)) * 100,
                        2
                    ) AS success_rate
                FROM api_dashboard_user u
                JOIN api_payout_log p ON u.company_id = p.company_id
                WHERE u.login_id = ?
                GROUP BY u.login_id, u.company_id
            `;

            connection.query(sql, [loginId], (err, results) => {
                if (err) return res.status(500).json({ message: "Database error", error: err });

                if (results.length === 0) {
                    return res.status(404).json({ message: "No payout data found" });
                }

                return res.status(200).json({
                    message: "Payout summary fetched successfully",
                    summary: results[0]
                });
            });
        } else {
            // Otherwise return detailed payout logs
            const payoutQuery = "SELECT * FROM api_payout_log WHERE company_id = ? ORDER BY txn_date DESC";
            connection.query(payoutQuery, [companyId], (err, payouts) => {
                if (err) return res.status(500).json({ error: "DB query failed" });

                return res.status(200).json({
                    message: "Payout logs fetched successfully",
                    count: payouts.length,
                    data: payouts
                });
            });
        }
    });
});




router.get("/payouts-logs", authMiddleware, (req, res) => {
    const loginId = req.user.login_id;

    const companyQuery = "SELECT company_id FROM api_dashboard_user WHERE login_id = ?";
    connection.query(companyQuery, [loginId], (err, companyResult) => {
        if (err) return res.status(500).json({ error: "DB query failed" });
        if (companyResult.length === 0) return res.status(404).json({ message: "User not found" });

        const companyId = companyResult[0].company_id;

        // Build SQL dynamically
        let sql = `SELECT * FROM api_payout_log WHERE company_id = ?`;
        const params = [companyId];

        // Status filter
        if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
            sql += " AND status = ?";
            params.push(req.query.status.toUpperCase());
        }

        // Date range filter
        if (req.query.start_date && req.query.end_date) {
            sql += " AND txn_date BETWEEN ? AND ?";
            params.push(req.query.start_date + " 00:00:00", req.query.end_date + " 23:59:59");
        }

        // Search filter
        if (req.query.search) {
            sql += " AND (txn_id LIKE ? OR account_no LIKE ? OR bank_name LIKE ?)";
            const searchKeyword = `%${req.query.search}%`;
            params.push(searchKeyword, searchKeyword, searchKeyword);
        }

        sql += " ORDER BY txn_date DESC";

        connection.query(sql, params, async (err, payouts) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });

            // Excel download
            if (req.query.download && req.query.download.toLowerCase() === "excel") {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Payout Logs");

                // Define header columns
                worksheet.columns = [
                    { header: "S.No", key: "s_no", width: 5 },
                    { header: "Txn ID", key: "txn_id", width: 20 },
                    { header: "Settlement Amount", key: "settlement_amount", width: 20 },
                    { header: "Charge", key: "settlement_charge", width: 15 },
                    { header: "Status", key: "status", width: 15 },
                    { header: "Mode", key: "mode", width: 15 },
                    { header: "Bank Name", key: "bank_name", width: 25 },
                    { header: "Account No", key: "account_no", width: 20 },
                    { header: "IFSC", key: "ifsc_code", width: 15 },
                    { header: "Txn Date", key: "txn_date", width: 20 },
                    { header: "Message", key: "message", width: 30 },
                ];

                // Add data rows
                payouts.forEach((p, index) => {
                    worksheet.addRow({
                        s_no: index + 1,
                        txn_id: p.txn_id,
                        settlement_amount: p.settlement_amount,
                        settlement_charge: p.settlement_charge,
                        status: p.status,
                        mode: p.mode,
                        bank_name: p.bank_name,
                        account_no: p.account_no,
                        ifsc_code: p.ifsc_code,
                        txn_date: p.txn_date,
                        message: p.message || "-",
                    });
                });

                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename=payouts_${Date.now()}.xlsx`
                );
                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );

                await workbook.xlsx.write(res);
                res.end();
                return;
            }

            // Normal JSON response
            return res.status(200).json({
                message: "Payout logs fetched successfully",
                count: payouts.length,
                data: payouts,
            });
        });
    });
});



router.get("/bulk-pay", authMiddleware, (req, res) => {
    const login_id = req.user?.login_id;
    if (!login_id) {
        return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

 
    connection.query(
        "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
        [login_id],
        (err, userResults) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err });
            }
            if (userResults.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const company_id = userResults[0].company_id;

            
            const sql = "SELECT * FROM api_bulk_pay_data WHERE company_id = ? ORDER BY txn_date DESC";

            connection.query(sql, [company_id], (err, bulkResults) => {
                if (err) {
                    return res.status(500).json({ message: "Database error", error: err });
                }

                return res.status(200).json({
                    message: "Bulk Pay Data fetched successfully",
                    company_id,
                    count: bulkResults.length,
                    data: bulkResults
                });
            });
        }
    );
});






module.exports = router;
