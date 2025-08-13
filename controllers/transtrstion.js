

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
        if (req.query.download && req.query.download.toLowerCase() === "excel") {
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


router.get("/payout-log/:txn_id", authMiddleware, (req, res) => {
    const { txn_id } = req.params;

    const query = "SELECT * FROM payout_logs WHERE txn_id = ?";

    connection.query(query, [txn_id], (err, results) => {
        if (err) {
            console.error("Error fetching payout log:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Payout log not found" });
        }

        return res.status(200).json(results[0]);
    });
});


module.exports = router;
