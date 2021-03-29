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
	let messages=await client.query(`SELECT * FROM messages WHERE id_conversation='${req.query.id}'`);
	res.json({results: messages});
}