require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
const fs=require('fs').promises;
const bcrypt=require('bcrypt');
exports.deleteAccount=async (req, res)=>{
  try{
    let truePassword=await client.query(`SELECT password FROM users where username='${req.user}'`);
    bcrypt.compare(req.body.password, truePassword.rows[0].password, async (err, result)=>{
      if (err){
        res.json({message: 'Error'});
      } else if (result){
        let message;
        let borrado=await client.query(`DELETE FROM users WHERE username='${req.user}'`);
        console.log(borrado);
        if (borrado.rowCount===1){
          message={message: 'Successful operation'};
          let userPhotos=await fs.readdir(`users-photos/${req.user}`);
          if (userPhotos.length>0){
            for (let i=0; i<userPhotos.length; i++){
              await fs.unlink(`users-photos/${req.user}/${userPhotos[i]}`);
            }
          }
        } else if (borrado.rowCount===0){
          message={message: 'Error'};
        }
        res.json(message);
        /*Despues de que el usuario  vea el mensaje de operacion exitosa, su sesion sera borrada y sera rerigido a index.html en
        5 segundos*/
        req.logout();
        res.redirect("/");
      } else{
        res.json({message: 'Error'});
      }
    });
  } catch(err){
    res.json({message: 'Error'});
  }
}