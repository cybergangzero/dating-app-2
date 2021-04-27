const fs=require('fs').promises;
const db=require('./pgpool.js');
const pool=db.getPool();
exports.deletePhoto=async (req, res)=>{
  try{
    const client=await pool.connect();
    await fs.unlink(`./users-photos/${req.user}/${req.body.foto}`);
    if (req.body.foto.includes('etiquetaFotoDePerfilxxxxx')){ 
      /*El usuario esta eliminando su foto de perfil. Entonces se sustituye en la base de datos el src del respectivo avatar
      Primero se consulta el sexo del usuario y luego se asigna el avatar*/
      let sexo=await client.query(`SELECT sex FROM users WHERE username='${req.user}'`);
      await client.query(`UPDATE users SET src_profile_photo='${sexo.rows[0].sex? '/default-avatars/male.jpeg' : '/default-avatars/female.jpeg'}' 
      	WHERE username='${req.user}'`);
    }
    res.json({message: "/my-profile/photos"}); //Para redirigir al usuario.
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
    res.json({message: "Operacion fallida, intentelo de nuevo."});
  }
}