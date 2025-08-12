// require('dotenv').config();
// const jwt = require("jsonwebtoken");

// const JWT_SECRET = process.env.JWT_SECRET;

// const authMiddleware=(req,res,next)=>{
//     const authHeader=req.headers['authorization'];
//     if(!authHeader || !authHeader.startsWith('Bearer')){
//         return res.status(401).json({message:"no token provided in header"});
//     }

//     const token =authHeader.split('')[1];
//     if(!token){
//         return res.status(401).json({message:"Token missing in header"});

//     }
//     try {
//         const decode=jwt.verify(token, JWT_SECRET);
//         res.user=decode;
//         next();
        
//     } catch (error) {
//         return res.status(401).json({meg:"Invalid or expired token"});
        
//     }
// }

// module.exports = { authMiddleware };
