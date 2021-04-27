const fs=require('fs').promises;
const db=require('./pgpool.js');
const pool=db.getPool();

module.exports.getUserProfilePicture=async(username)=>{
  const client=await pool.connect();
  try{
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
  client.release();
  return srcProfilePhoto;
} catch(err){
  //return '';
}

}
