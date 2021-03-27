const fs=require('fs').promises;
require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
exports.deletePhoto=async (req, res)=>{
  try{
    await fs.unlink(`./users-photos/${req.user}/${req.body.foto}`);
    if (req.body.foto.includes('etiquetaFotoDePerfilxxxxx')){ 
      /*El usuario esta eliminando su foto de perfil. Entonces se sustituye en la base de datos el src del respectivo avatar
      Primero se consulta el sexo del usuario y luego se asigna el avatar*/
      let sexo=await client.query(`SELECT sex FROM users WHERE username='${req.user}'`);
      await client.query(`UPDATE users SET src_profile_photo='${sexo.rows[0].sex? '/default-avatars/male.jpeg' : '/default-avatars/female.jpeg'}' 
      	WHERE username='${req.user}'`);
    }
    res.json({message: "/my-profile/photos"}); //Para redirigir al usuario.
  } catch(err){
    res.json({message: "Operacion fallida, intentelo de nuevo."});
  }
}