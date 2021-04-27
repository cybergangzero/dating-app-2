const db=require('./pgpool.js');
const pool=db.getPool();
const fs=require('fs').promises;
const bcrypt=require('bcrypt');
exports.deleteAccount=async (req, res)=>{
  try{
    const client=await pool.connect();
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
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
    res.json({message: 'Error'});
  }
}