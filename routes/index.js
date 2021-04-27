const express=require('express');
const router=express.Router();
const htmlFilePath=__dirname.replace('/routes', '');
const signin=require('./modules/signin.js');
const localLogin=require('./modules/passport-local-login.js');
const isLoggedIn=require('./modules/isLoggedIn.js');
const recoverAccount=require('./modules/recover-account.js');
const {body, validationResult}=require('express-validator');

const db=require('./modules/pgpool.js');
const pool=db.getPool();

router.get('/', (req, res)=>{
  if (req.isAuthenticated()){
    res.redirect('/my-profile');
  } else{
    res.sendFile(htmlFilePath+'/index.html');
  }
});
router.route('/registry')
  .get((req, res)=>{
    res.sendFile(htmlFilePath+'/registry.html');
  })
  .post(  //Antes de las pertinentes operaciones, valido y desinfecto los datos, si algun error, le avisare al usuario.
     body('username').isLength({ min: 5, max: 20}),
     body('password').isLength({ min: 6, max: 20}),
     body('name').isLength({min: 3, max: 20 }), //minimo 3 porque el nombre mas corto que se me ocurrio fue "ana"
     body('lastName').isLength({min: 5, max: 20}),
     body('username').trim().escape(),
     body('password').trim().escape(),
     body('name').trim().escape(),
     body('lastName').trim().escape(),
    (req, res)=>{
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors=validationResult(req);
    if (!errors.isEmpty()){
      return res.redirect('/error:sign-up-failed');
    }
    signin.signin(req, res);
  })
router.get('/succesful-sign-up', (req, res)=>{
  res.sendFile(htmlFilePath+'/successful-sign-up.html');
});
router.get('/error:sign-up-failed', (req, res)=>{
  res.sendFile(htmlFilePath+'/error:sign-up-failed.html');
});


router.post('/login',
   body('username').isLength({ min: 5, max: 20}),
   body('password').isLength({ min: 6, max: 20}),
   body('username').trim().escape(),
   body('password').trim().escape(),
   (req, res)=>{
     const errors=validationResult(req);
     if (!errors.isEmpty()){
       return res.redirect('/error:incorrect-data');
     }
     localLogin.authenticate(req, res);
  }
);

router.get('/error:incorrect-data', (req, res)=>{
  res.sendFile(htmlFilePath+'/error:incorrect-data.html');
});

router.get('/online', isLoggedIn.isLoggedIn, async (req, res)=>{
  const client=await pool.connect();
  await client.query(`UPDATE users SET online=true WHERE username='${req.user}'`);
  client.release();
  res.redirect('/my-profile');
});

router.get('/logout', async (req, res)=>{
  const client=await pool.connect();
  await client.query(`UPDATE users SET online=false WHERE username='${req.user}'`);
  client.release();
  req.logout();
  res.redirect("/");
});

router.get('/recover-account', (req, res)=>{
  res.sendFile(htmlFilePath+'/recover-account.html');
});

router.put('/recover-account',
  body('username').isLength({ min: 5, max: 20}),
  body('code').isLength({min:10, max: 10}),
  body('newPassword').isLength({min: 6, max: 20}),
  body('username').trim().escape(),
  body('code').trim().escape(),
  body('newPassword').trim().escape(),
  (req, res)=>{
  const errors=validationResult(req);
  if (!errors.isEmpty()){
    return res.json({result: 'Datos invalidos, por favor, intentelo de nuevo con datos validos'});
  }
  recoverAccount(req, res);
});

module.exports=router;