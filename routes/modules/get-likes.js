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
    let template=await fs.readFile(htmlFilePath+'/likes.html', 'utf8');
    let likes=await client.query(`SELECT * FROM likes WHERE id_user='${req.user}'`), users='';
    for (let i=0; i<likes.rows.length; i++){
      let srcFotoDePerfil=await getProfilePhoto.getUserProfilePicture(likes.rows[i].id_user_who_likes);
      users+=`<tr><td><a href="/search/users/user-profile?userName=${likes.rows[i].id_user_who_likes}"><img src="${srcFotoDePerfil}">
        <p>${likes.rows[i].id_user_who_likes}</td></tr>`;
    }
    if (users!==''){
      template=template.replace('<!--users-->', users);
    } else{
      template=template.replace('<!--users-->', '<h1>Parece que todavia no le gustas a nadie :(</h1>');
    }
    //Antes de enviar la plantilla, actualizo los likes no vistos a vistos.
    await client.query(`UPDATE likes SET checked_by_the_user=true WHERE id_user='${req.user}'`);
    res.send(template);
  } catch(err){
  	res.send('Ha ocurrido un error. Intentelo de nuevo.');
  }
}