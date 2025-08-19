

const express = require("express");
const connection = require("../db/db.js");
const { authMiddleware } = require("../middleware/auth");



const router = express.Router();


// router.get("/wallet-company", authMiddleware, (req, res) => {
//     const loginId = req.user.login_id;


//     const companyQuery = "SELECT company_id FROM api_dashboard_user WHERE login_id = ?";
//     connection.query(companyQuery, [loginId], (err, companyResult) => {
//         if (err) return res.status(500).json({ error: "DB query failed" });
//         if (companyResult.length === 0) return res.status(404).json({ message: "User not found" });

//         const companyId = companyResult[0].company_id;

        
//         const walletQuery = "SELECT * FROM api_wallet_company WHERE company_id = ?";
//         connection.query(walletQuery, [companyId], (err, walletResult) => {
//             if (err) return res.status(500).json({ error: "DB query failed" });
//             // res.json(walletResult);
//             return res.status(200).json({
//                 message: "Wallet company fetched successfully",
//                 count: walletResult.length,
//                 data: walletResult
//             })
//         });
//     });
// });


router.get("/wallet-company", authMiddleware, (req, res) => {
    const loginId = req.user.login_id;

    const companyQuery = "SELECT company_id FROM api_dashboard_user WHERE login_id = ?";
    connection.query(companyQuery, [loginId], (err, companyResult) => {
        if (err) return res.status(500).json({ error: "DB query failed" });
        if (companyResult.length === 0) return res.status(404).json({ message: "User not found" });

        const companyId = companyResult[0].company_id;

        const walletQuery = `
            SELECT 
                id,
                company_id,
                wallet_balance,
                hold_balance,
                aeps_wallet,
                last_update,
                status
            FROM api_wallet_company 
            WHERE company_id = ?`;

        connection.query(walletQuery, [companyId], (err, walletResult) => {
            if (err) return res.status(500).json({ error: "DB query failed" });
            if (walletResult.length === 0) return res.status(404).json({ message: "No wallet data found" });

            // Calculate total balances
            let totalWalletBalance = 0;
            let totalHoldBalance = 0;
            let totalAepsBalance = 0;

            walletResult.forEach(w => {
                totalWalletBalance += parseFloat(w.wallet_balance || 0);
                totalHoldBalance += parseFloat(w.hold_balance || 0);
                totalAepsBalance += parseFloat(w.aeps_wallet || 0);
            });

            return res.status(200).json({
                message: "Wallet company fetched successfully",
                count: walletResult.length,
                // total: {
                //     wallet_balance: totalWalletBalance,
                //     hold_balance: totalHoldBalance,
                //     aeps_wallet: totalAepsBalance,
                //     overall_balance: totalWalletBalance + totalHoldBalance + totalAepsBalance
                // },
                total:totalWalletBalance,
                data: walletResult
            });
        });
    });
});


module.exports = router;