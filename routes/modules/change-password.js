require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
const bcrypt=require('bcrypt');
const saltRounds=10;
exports.changePassword=(req, res)=>{ 
  try{
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
  } catch(err){
  	res.json({message: 'Error'});
  }
}