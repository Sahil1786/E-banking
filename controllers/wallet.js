

const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");



const router = express.Router();






router.get("/wallet-company", authMiddleware, async (req, res) => {
  try {
    const loginId = req.user?.login_id;
    if (!loginId) {
      return res.status(401).json({ message: "Unauthorized: Missing login_id" });
    }


    const [companyResult] = await connection.execute(
      "SELECT company_id FROM api_dashboard_user WHERE login_id = ?",
      [loginId]
    );

    if (companyResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const companyId = companyResult[0].company_id;

    
    const [walletResult] = await connection.execute(
      `SELECT 
          id,
          company_id,
          wallet_balance,
          hold_balance,
          aeps_wallet,
          last_update,
          status
       FROM api_wallet_company 
       WHERE company_id = ?`,
      [companyId]
    );

    if (walletResult.length === 0) {
      return res.status(404).json({ message: "No wallet data found" });
    }

    let totalWalletBalance = 0;
    let totalHoldBalance = 0;
    let totalAepsBalance = 0;

    walletResult.forEach(w => {
      totalWalletBalance += parseFloat(w.wallet_balance || 0);
      totalHoldBalance += parseFloat(w.hold_balance || 0);
      totalAepsBalance += parseFloat(w.aeps_wallet || 0);
    });

  
    return res.status(200).json({
      count: walletResult.length,
      total: totalWalletBalance, 
      data: walletResult
    });
  } catch (err) {
    console.error("wallet-company error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;