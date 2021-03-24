const express=require('express');
const router=express();
const htmlFilePath=__dirname.replace('/routes', '');
const logged=require('./modules/isLoggedIn.js');
const delete_account=require('./modules/delete-account.js');
const change_password=require('./modules/change-password.js');
const {body, validationResult}=require('express-validator');

router.get('/', logged.isLoggedIn, (req, res)=>{
  res.sendFile(htmlFilePath+'/account-settings.html');
});

//Incluso aqui hay que evitar ataques de inyecccion sql.

router.delete('/delete-account', 
  body('password').isLength({min: 6, max: 20}),
  body('password').trim().escape(),
  (req, res)=>{
  	const errors=validationResult(req);
    if (!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() });
    }
  	delete_account.deleteAccount(req, res);
  }
);

router.put('/change-password',
  body('password').isLength({min: 6, max: 20}),
  body('password').trim().escape(),
  (req, res)=>{
  	const errors=validationResult(req);
    if (!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() });
    }
  	 change_password.changePassword(req, res);
  }
);

module.exports=router;