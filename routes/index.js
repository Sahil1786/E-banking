
const express = require('express');

const router =express.Router();
const userRouter = require('../controllers/Users.js');
const transactionRouter = require('../controllers/transtrstion.js');

   




  

router.use('/user', userRouter);
router.use('/user', transactionRouter);


module.exports=router;