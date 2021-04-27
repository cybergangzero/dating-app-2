const db=require('./pgpool.js');
const pool=db.getPool();
const fs=require('fs').promises;
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
const getProfilePhoto=require('./get-user-profile-picture.js');

module.exports=async (req, res)=>{
  try{
    const client=await pool.connect();
    let consulta=`SELECT users.src_profile_photo, users.online, users.username, users.country, users.age FROM users
      INNER JOIN likes ON likes.id_user='${req.user}' AND likes.id_user_who_likes=users.username`;
    let usersWhoLikes=await client.query(consulta);
    //Antes de enviar el resultado de la consulta, actualizo los likes no vistos a vistos.
    await client.query(`UPDATE likes SET checked_by_the_user=true WHERE id_user='${req.user}'`);
    res.json({results: usersWhoLikes});
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
  	res.json({results: 'Ha ocurrido un error. Intentelo de nuevo.'});
  }
}