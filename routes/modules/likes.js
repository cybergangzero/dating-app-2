//Codigo que se encarga de gestionar los me gusta de los usuarios. Se agregan o se eliminan
require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();

module.exports=async (req, res)=>{
  if (req.body.buttonStatus==='btn btn-secondary'){ //Si es un me gusta recibido por el usuario
    try{
      await client.query(`INSERT INTO likes values('${req.body.receivingUser}', '${req.user}', 'false')`);
      res.json({message: 'Operacion exitosa'});
    } catch(err){
      res.json({message: 'Error en la operacion.'});
    }
  } else{
  	try{
      await client.query(`DELETE FROM likes WHERE id_user='${req.body.receivingUser}' AND id_user_who_likes='${req.user}'`);
      res.json({message: 'Operacion exitosa'});
  	} catch(err){
      res.json({message: 'Error en la operacion.'});
  	}
  }
};