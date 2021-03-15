const express=require('express');
const router=express.Router();
const logged=require('./modules/isLoggedIn.js');
const chatInterface=require('./modules/chat-interface.js');
const chatBetweenUsers=require('./modules/chat-between-users.js');
router.get('/', logged.isLoggedIn, chatInterface);
router.get('/chat', logged.isLoggedIn, chatBetweenUsers);
module.exports=router;