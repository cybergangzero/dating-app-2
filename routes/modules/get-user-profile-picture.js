require('dotenv').config();
const fs=require('fs').promises;
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();

module.exports.getUserProfilePicture=async(username)=>{
  let sexo=await client.query(`SELECT sex FROM users WHERE username='${username}'`), avatar;
  if (sexo.rows[0].sex){
    avatar='/default-avatars/male.jpeg';
  } else{
    avatar='/default-avatars/female.jpeg';
  }
  const profilePictureTag='etiquetaFotoDePerfilxxxxx';
  let srcProfilePhoto='', photos;
  try{
    await fs.opendir(`users-photos/${username}`);
    photos=await fs.readdir(`users-photos/${username}`);
  } catch(err){
    photos=[];
  }
  if (photos.length===0){
    srcProfilePhoto=avatar; 
  } else{
      let i=0, flag=false;
      while (i<photos.length && !flag){
        if (photos[i].includes(profilePictureTag)){
          srcProfilePhoto=`/${username}/${photos[i]}`;
          flag=true;
        }
        i++;
      }
      if (!flag){
        srcProfilePhoto=avatar;
      }
  }
  return srcProfilePhoto;
}
