

const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();


router.get("/fund-requests", authMiddleware, async (req, res) => {
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


    const [fundRequests] = await connection.execute(
      "SELECT * FROM api_fund_request WHERE company_id = ? ORDER BY create_on DESC",
      [company_id]
    );


    return res.status(200).json({
      count: fundRequests.length,
      fundRequests
    });
  } catch (err) {
    console.error("fund-requests error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});




// router.get("/fund-requests/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const company_id = req.params.company_id;

//     if (!company_id) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

//     const [fundRequests] = await connection.execute(
//       "SELECT * FROM api_fund_request WHERE company_id = ? ORDER BY create_on DESC",
//       [company_id]
//     );

//     return res.status(200).json({
//       count: fundRequests.length,
//       fundRequests
//     });
//   } catch (err) {
//     console.error("fund-requests error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });


router.get("/entity-settlement-account", authMiddleware, async (req, res) => {
  try {
    const login_id = req.user?.login_id;

    if (!login_id) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }

  
    const [results] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [login_id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const company_id = results[0].company_id;


    const [accounts] = await connection.execute(
      `SELECT * 
       FROM entity_settlement_account 
       WHERE company_id = ? 
       ORDER BY create_on DESC`,
      [company_id]
    );

    
    return res.status(200).json({
      count: accounts.length,
      accounts
    });
  } catch (err) {
    console.error("entity-settlement-account error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// router.get("/entity-settlement-account/:company_id", authMiddleware, async (req, res) => {
//   try {
//     const company_id = req.params.company_id;  

//     if (!company_id) {
//       return res.status(400).json({ message: "Missing company_id in params" });
//     }

//     const [accounts] = await connection.execute(
//       `SELECT * 
//        FROM entity_settlement_account 
//        WHERE company_id = ? 
//        ORDER BY create_on DESC`,
//       [company_id]
//     );

//     return res.status(200).json({
//       count: accounts.length,
//       accounts
//     });
//   } catch (err) {
//     console.error("entity-settlement-account error:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

module.exports = router;
