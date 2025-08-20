


const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");
const ExcelJS = require("exceljs");

const router = express.Router();






router.get("/wallet-ledger", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

 
    const [results] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const company_id = results[0].company_id;

   
    let sql = `SELECT * FROM api_statement_log WHERE company_id = ?`;
    const params = [company_id];

    if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
      sql += " AND txn_status = ?";
      params.push(req.query.status.toUpperCase());
    }


    if (req.query.start_date && req.query.end_date) {
      sql += " AND date_time BETWEEN ? AND ?";
      params.push(
        req.query.start_date + " 00:00:00",
        req.query.end_date + " 23:59:59"
      );
    }

    
    if (req.query.search) {
      sql += " AND (order_id LIKE ? OR customer_mobile LIKE ?)";
      const searchKeyword = `%${req.query.search}%`;
      params.push(searchKeyword, searchKeyword);
    }

    sql += " ORDER BY date_time DESC";


    const [transactions] = await connection.execute(sql, params);

    
    if (req.query.download && req.query.download.toLowerCase() === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Transactions");

   
      worksheet.columns = [
        { header: "S.No", key: "s_no", width: 5 },
        { header: "Order ID", key: "order_id", width: 25 },
        { header: "Customer Mobile", key: "customer_mobile", width: 20 },
        { header: "Amount", key: "txn_amount", width: 15 },
        { header: "Status", key: "txn_status", width: 15 },
        { header: "Date", key: "date_time", width: 20 },
        { header: "Remark", key: "remark", width: 30 },
      ];

  
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
      return res.end();
    }

  
    return res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("wallet-ledger error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});




router.get("/payouts-report", authMiddleware, async (req, res) => {
  try {
    const loginId = req.user.login_id;

    // 🔹 Get companyId
    const [companyResult] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [loginId]
    );

    if (companyResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const companyId = companyResult[0].company_id;

  
    const sql = `
      SELECT 
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
      FROM api_payout_log p
      WHERE p.company_id = ?
    `;

    const [results] = await connection.execute(sql, [companyId]);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No payout data found" });
    }

    return res.status(200).json({
      total_payout_value: results[0].total_payout_value || 0,
      pending_count: results[0].pending_count || 0,
      pending_value: results[0].pending_value || 0,
      failed_count: results[0].failed_count || 0,
      failed_value: results[0].failed_value || 0,
      success_rate: results[0].success_rate || 0
    });

  } catch (err) {
    console.error("payouts error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});





router.get("/payouts-logs", authMiddleware, async (req, res) => {
  try {
    const loginId = req.user.login_id;

   
    const [companyResult] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [loginId]
    );

    if (companyResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const companyId = companyResult[0].company_id;

   
    let sql = `SELECT * FROM api_payout_log WHERE company_id = ?`;
    const params = [companyId];

  
    if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
      sql += " AND status = ?";
      params.push(req.query.status.toUpperCase());
    }

if (req.query.start_date && req.query.end_date) {
  sql += " AND txn_date BETWEEN ? AND ?";
  params.push(req.query.start_date + " 00:00:00", req.query.end_date + " 23:59:59");
}

if (req.query.date) {
  sql += " AND DATE(txn_date) = ?";
  params.push(req.query.date); 
}
    
    if (req.query.search) {
      sql += " AND (txn_id LIKE ? OR account_no LIKE ? OR bank_name LIKE ?)";
      const searchKeyword = `%${req.query.search}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    sql += " ORDER BY txn_date DESC";

   
    const [payouts] = await connection.execute(sql, params);

  
    if (req.query.download && req.query.download.toLowerCase() === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Payout Logs");

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
      return res.end();
    }

    
    return res.status(200).json({
      count: payouts.length,
      data: payouts,
    });
  } catch (err) {
    console.error("payouts-logs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});



router.get("/bulk-pay", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;
    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

    
    const [userResults] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const company_id = userResults[0].company_id;

    
    const [bulkResults] = await connection.execute(
      "SELECT * FROM api_bulk_pay_data WHERE company_id = ? ORDER BY txn_date DESC",
      [company_id]
    );

  
    return res.status(200).json({
      company_id,
      count: bulkResults.length,
      data: bulkResults
    });

  } catch (err) {
    console.error("bulk-pay error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// router.get("/wallet-ledger/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const company_id = req.params.company_id;

//     if (!company_id) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

   
//     let sql = `SELECT * FROM api_statement_log WHERE company_id = ?`;
//     const params = [company_id];


//     if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
//       sql += " AND txn_status = ?";
//       params.push(req.query.status.toUpperCase());
//     }


//     if (req.query.start_date && req.query.end_date) {
//       sql += " AND date_time BETWEEN ? AND ?";
//       params.push(
//         req.query.start_date + " 00:00:00",
//         req.query.end_date + " 23:59:59"
//       );
//     }

  
    
//     if (req.query.date) {
//       sql += " AND DATE(date_time) = ?";
//       params.push(req.query.date);
//     }

 
    
//     if (req.query.search) {
//       sql += " AND (order_id LIKE ? OR customer_mobile LIKE ?)";
//       const searchKeyword = `%${req.query.search}%`;
//       params.push(searchKeyword, searchKeyword);
//     }

//     sql += " ORDER BY date_time DESC";


    
//     const [transactions] = await connection.execute(sql, params);


    
//     if (req.query.download && req.query.download.toLowerCase() === "excel") {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet("Transactions");

//       worksheet.columns = [
//         { header: "S.No", key: "s_no", width: 5 },
//         { header: "Order ID", key: "order_id", width: 25 },
//         { header: "Customer Mobile", key: "customer_mobile", width: 20 },
//         { header: "Amount", key: "txn_amount", width: 15 },
//         { header: "Status", key: "txn_status", width: 15 },
//         { header: "Date", key: "date_time", width: 20 },
//         { header: "Remark", key: "remark", width: 30 },
//       ];

//       transactions.forEach((t, index) => {
//         worksheet.addRow({
//           s_no: index + 1,
//           order_id: t.order_id,
//           customer_mobile: t.customer_mobile || "-",
//           txn_amount: t.txn_amount,
//           txn_status: t.txn_status,
//           date_time: t.date_time,
//           remark: t.remark || "-",
//         });
//       });

//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=transactions_${Date.now()}.xlsx`
//       );
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );

//       await workbook.xlsx.write(res);
//       return res.end();
//     }


    
//     return res.status(200).json({
//       count: transactions.length,
//       transactions,
//     });
//   } catch (err) {
//     console.error("wallet-ledger error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

// router.get("/payouts/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const companyId = req.params.company_id;

//     if (!companyId) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

    
//     if (req.query.report && req.query.report.toLowerCase() === "true") {
//       const sql = `
//         SELECT 
//           ? AS company_id,
//           COUNT(p.id) AS total_payouts,

//           SUM(CAST(p.settlement_amount AS DECIMAL(15,2))) AS total_payout_value,

//           SUM(CASE WHEN p.status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
//           SUM(CASE WHEN p.status = 'SUCCESS' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS success_value,

//           SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
//           SUM(CASE WHEN p.status = 'PENDING' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS pending_value,

//           SUM(CASE WHEN p.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
//           SUM(CASE WHEN p.status = 'FAILED' THEN CAST(p.settlement_amount AS DECIMAL(15,2)) ELSE 0 END) AS failed_value,

//           ROUND(
//               (SUM(CASE WHEN p.status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(p.id)) * 100,
//               2
//           ) AS success_rate
//         FROM api_payout_log p
//         WHERE p.company_id = ?
//       `;

//       const [results] = await connection.execute(sql, [companyId, companyId]);

//       if (results.length === 0 || !results[0].total_payouts) {
//         return res.status(404).json({ message: "No payout data found" });
//       }

//       return res.status(200).json({
//         message: "Payout summary fetched successfully",
//         summary: results[0],
//       });
//     }


    
//     const [payouts] = await connection.execute(
//       "SELECT * FROM api_payout_log WHERE company_id = ? ORDER BY txn_date DESC",
//       [companyId]
//     );

//     return res.status(200).json({
//       count: payouts.length,
//       data: payouts,
//     });

//   } catch (err) {
//     console.error("payouts error:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// router.get("/payouts-logs/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const companyId = req.params.company_id;

//     if (!companyId) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

   
    
//     let sql = `SELECT * FROM api_payout_log WHERE company_id = ?`;
//     const params = [companyId];

//     if (req.query.status && req.query.status.toUpperCase() !== "ALL") {
//       sql += " AND status = ?";
//       params.push(req.query.status.toUpperCase());
//     }

//     if (req.query.start_date && req.query.end_date) {
//       sql += " AND txn_date BETWEEN ? AND ?";
//       params.push(req.query.start_date + " 00:00:00", req.query.end_date + " 23:59:59");
//     }

//     if (req.query.date) {
//       sql += " AND DATE(txn_date) = ?";
//       params.push(req.query.date);
//     }

//     if (req.query.search) {
//       sql += " AND (txn_id LIKE ? OR account_no LIKE ? OR bank_name LIKE ?)";
//       const searchKeyword = `%${req.query.search}%`;
//       params.push(searchKeyword, searchKeyword, searchKeyword);
//     }

//     sql += " ORDER BY txn_date DESC";


    
//     const [payouts] = await connection.execute(sql, params);


    
//     if (req.query.download?.toLowerCase() === "excel") {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet("Payout Logs");

//       worksheet.columns = [
//         { header: "S.No", key: "s_no", width: 5 },
//         { header: "Txn ID", key: "txn_id", width: 20 },
//         { header: "Settlement Amount", key: "settlement_amount", width: 20 },
//         { header: "Charge", key: "settlement_charge", width: 15 },
//         { header: "Status", key: "status", width: 15 },
//         { header: "Mode", key: "mode", width: 15 },
//         { header: "Bank Name", key: "bank_name", width: 25 },
//         { header: "Account No", key: "account_no", width: 20 },
//         { header: "IFSC", key: "ifsc_code", width: 15 },
//         { header: "Txn Date", key: "txn_date", width: 20 },
//         { header: "Message", key: "message", width: 30 },
//       ];

//       payouts.forEach((p, index) => {
//         worksheet.addRow({
//           s_no: index + 1,
//           txn_id: p.txn_id,
//           settlement_amount: p.settlement_amount,
//           settlement_charge: p.settlement_charge,
//           status: p.status,
//           mode: p.mode,
//           bank_name: p.bank_name,
//           account_no: p.account_no,
//           ifsc_code: p.ifsc_code,
//           txn_date: p.txn_date,
//           message: p.message || "-",
//         });
//       });

//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=payouts_${Date.now()}.xlsx`
//       );
//       res.setHeader(
//         "Content-Type",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );

//       await workbook.xlsx.write(res);
//       return res.end();
//     }


//     return res.status(200).json({
//       count: payouts.length,
//       data: payouts,
//     });

//   } catch (err) {
//     console.error("payouts-logs error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });
// router.get("/bulk-pay/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const company_id = req.params.company_id; 

//     if (!company_id) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

//     const [bulkResults] = await connection.execute(
//       "SELECT * FROM api_bulk_pay_data WHERE company_id = ? ORDER BY txn_date DESC",
//       [company_id]
//     );

//     return res.status(200).json({
//       company_id,
//       count: bulkResults.length,
//       data: bulkResults
//     });

//   } catch (err) {
//     console.error("bulk-pay error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });


module.exports = router;
