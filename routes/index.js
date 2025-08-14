
const express = require('express');

const router =express.Router();
const userRouter = require('../controllers/Users.js');
const transactionRouter = require('../controllers/transtrstion.js');
const walletRouter = require('../controllers/wallet.js');

   




  

router.use('/user', userRouter);
router.use('/user', transactionRouter);
router.use('/user',walletRouter)



module.exports=router;