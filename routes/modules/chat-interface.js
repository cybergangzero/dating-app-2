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
const onlineCircle=require('./paste-circle-online.js');
const profilePhoto=require('./get-user-profile-picture.js');
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
module.exports=async (req, res)=>{
  /*Aqui solo tengo que consultar las conversaciones que tenga el usuario en la tabla "conversations", ya sea
  obtener todas donde el "id_user_a" es el usuario solicitante, o el "id_user_b".
  Al obtener esos datos, tambien obtendre el nombre del usuario correspondiente con el que chatea, la foto, la cantidad
  de nuevos mensajes que tenga (si los tiene) y el ultimo mensaje de esa conversacion (si la hay). 
  Este ultimo mensaje sera la ultima columna de la tabla "conversations". Esto implica algo importante:
  El "last_message_sent" sera del tipo texto, y, contendra tanto el nombre del usuario que envio el mensaje, como su texto, 
  de la forma "user: message".
  Anexo esos datos a la plantilla de interfaz de chat y la envio al usuario solicitante.*/
  
}