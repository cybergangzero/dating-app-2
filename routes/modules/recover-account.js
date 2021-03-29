require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
const bcrypt=require('bcrypt');
const saltRounds=10;

module.exports=async (req, res)=>{
  try{
    let datosValidos=await client.query(`SELECT * FROM users WHERE username='${req.body.username}' AND recovery_code='${req.body.code}'`);
    if (datosValidos.rowCount===0){
      res.json({result: 'Usuario o codigo invalido, por favor, intentelo de nuevo'});
    } else if (datosValidos.rowCount===1){
      bcrypt.genSalt(saltRounds, (err, salt)=>{
        if (err){
          return res.json({result: 'Ha ocurrido un error, por favor, intentelo de nuevo'});
        }
        bcrypt.hash(req.body.newPassword, salt, async (err, hash)=>{
          if (err){
            return res.json({result: 'Ha ocurrido un error, por favor, intentelo de nuevo'});
          }
          let hashedPassword=hash;
          await client.query(`UPDATE users SET password='${hashedPassword}' WHERE username='${req.body.username}'`);
          res.json({result: 'Su contraseña ha sido actualizada! Ahora puede iniciar sesion con esa nueva contraseña.'});
        });
      });
    }
  } catch(err){
    res.json({result: 'Ha ocurrido un error, por favor, intentelo de nuevo'});
  }
}