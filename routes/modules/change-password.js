const db=require('./pgpool.js');
const pool=db.getPool();
const bcrypt=require('bcrypt');
const saltRounds=10;
exports.changePassword=async (req, res)=>{ 
  try{
    const client=await pool.connect();
  	bcrypt.genSalt(saltRounds, (err, salt)=>{
  	  if (err){
  	  	return res.json({message: 'Error'});
  	  } 
      bcrypt.hash(req.body.password, salt, async (err, hash)=>{
        if (err){
          return res.json({message: 'Error'});
        }
        await client.query(`UPDATE users SET password='${hash}' WHERE username='${req.user}'`);
        res.json({message: 'Successful operation'});
      });
    });
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
  	res.json({message: 'Error'});
  }
}