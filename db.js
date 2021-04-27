//Codigo que sirve para crear la base de datos...
require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST
});
client.connect();
const fs=require('fs');

fs.readFile('db.txt', 'utf8', (err, content)=>{
  if (err) throw err;
  client.query(content, (err, res)=>{
    if (err) throw err;
    console.log('Base de datos creada!');
  });
});