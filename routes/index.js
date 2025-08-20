
const express = require('express');

const router =express.Router();
const userRouter = require('../controllers/Users.js');
const transactionRouter = require('../controllers/transtrstion.js');
const walletRouter = require('../controllers/wallet.js');
const accountRouter = require('../controllers/account.js');

const entityRouter = require('../controllers/entity.js');
   




  

router.use('/user', userRouter);
router.use('/user', transactionRouter);
router.use('/user',walletRouter)
router.use('/user', accountRouter);
router.use('/user', entityRouter);



module.exports=router;