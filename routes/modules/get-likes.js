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
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
const getProfilePhoto=require('./get-user-profile-picture.js');

module.exports=async (req, res)=>{
  try{
    let consulta=`SELECT users.src_profile_photo, users.online, users.username, users.country, users.age FROM users
      INNER JOIN likes ON likes.id_user='${req.user}' AND likes.id_user_who_likes=users.username`;
    let usersWhoLikes=await client.query(consulta);
    //Antes de enviar el resultado de la consulta, actualizo los likes no vistos a vistos.
    await client.query(`UPDATE likes SET checked_by_the_user=true WHERE id_user='${req.user}'`);
    res.json({results: usersWhoLikes});
  } catch(err){
  	res.json({results: 'Ha ocurrido un error. Intentelo de nuevo.'});
  }
}