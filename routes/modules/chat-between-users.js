require('dotenv').config();
const get_user_profile_picture=require('./get-user-profile-picture.js');
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
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

module.exports=async (req, res)=>{
   /*Entonces, el proceso es el siguiente:
  Primero obtengo la foto de perfil del usuario con el que el usuario solicitante va a chatear. 
  Luego anexo la foto y el nombre del usuario a la plantilla de chat
  Despues obtengo la conversacion de ambos usuarios de la tabla "conversations" de base de datos.
  La manera en como hare la consulta sera de la siguiente forma:
  Comparo los nombres de los dos usuarios. El nombre que sea menor (alfabeticamente) sera el "id_user_a"
  y el mayor el "id_user_b". Si existe la conversacion, entonces consulto todos los mensajes con ese
  id en la tabla "messages".
  Si no existe, entonces creo la conversacion con el id correspondiente (las conversacion creada sera el id de la conversacion
  anterior+1), con el orden de usuarios correspondientes (id_user_a e id_user_b).
  Luego de eso mantengo en memoria el id de la conversacion para anexarla en la plantilla.
  Esto sera asi porque si el usuario envia un mensaje, en vez de hacer una consulta para obtener el id de la conversacion
  correspondiente al que el usuario envia un mensaje, simplemente envia ese mensajes, su nombre de usuario y el id que
  se encontra en la plantilla del cliente como etiqueta oculta. Esto evitara problemas de rendimiento al enviar mensajes 
  entre usuarios.
  Anexo a la plantilla todos los datos extraidos y la envio al usuario solicitante.
  Fin
  */
  let profilePhoto=await get_user_profile_picture.getUserProfilePicture(req.query.userName);
  let plantilla=await fs.readFile(htmlFilePath+'/chat.html', 'utf8');
  plantilla=plantilla.replace('<!--#profilePhoto-->', `<img src="${profilePhoto}">`);
  //Aparte de los datos importantes, tambien consultare si el usuario esta online para poner o no el circulito respectivo :p
  let online=await client.query(`SELECT online FROM users WHERE username='${req.query.userName}'`);
  plantilla=plantilla.replace('<!--#username-->', `<p>${req.query.userName}</p>`);
  plantilla=plantilla.replace('<!--hide-->', `<div id="${req.user}"></div>`); /*Este div sin contenido solo se encargara
  de guardar el nombre del usuario como id para poder expresar el emisor de cada mensaje.*/
  plantilla=plantilla.replace('<!--online-->', onlineCircle.pasteCircleOnline(online.rows[0].online));
  let order=[];
  if (req.user<req.query.userName){
    order.push(req.user);
    order.push(req.query.userName);
  } else{
    order.push(req.query.userName);
    order.push(req.user);
  }
  let conversation=await client.query(`SELECT * FROM conversations WHERE id_user_a='${order[0]}' AND id_user_b=${order[1]}`);
  if (conversation.rows.length===1){

  } else{
    
  }
  res.send(plantilla);
}