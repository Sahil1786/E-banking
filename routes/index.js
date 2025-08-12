
const express = require('express');

const router =express.Router();
const userRouter = require('../controllers/Users.js');

   




  

router.use('/user', userRouter);
// Use the user router for routes starting with /users
module.exports=router;