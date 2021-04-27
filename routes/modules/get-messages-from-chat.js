const db=require('./pgpool.js');
const pool=db.getPool();
module.exports=async (req, res)=>{
	const client=await pool.connect();
	let messages=await client.query(`SELECT * FROM messages WHERE id_conversation='${req.query.id}'`);
	res.json({results: messages});
	client.release();
}