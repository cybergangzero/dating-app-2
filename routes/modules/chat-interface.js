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
  let plantilla=await fs.readFile(htmlFilePath+'/chat-interface.html', 'utf8');
  let profilePhotosOtherUsers=[], lastChatMessages=[], online=[], notificationNewMessages=[], users=[], theActualOtherUser='';
  let conversations=await client.query(`SELECT * FROM conversations WHERE id_user_a='${req.user}' OR id_user_b='${req.user}'`);
  for (let i=0; i<conversations.rowCount; i++){
    if (req.user===conversations.rows[i].id_user_a){
      users.push(conversations.rows[i].id_user_b);
      theActualOtherUser=conversations.rows[i].id_user_b;
    } else{
      users.push(conversations.rows[i].id_user_a);                
      theActualOtherUser=conversations.rows[i].id_user_a;
    }
    /*Aparte de las fotos y el ultimo mensaje de chat, aprovechare de obtener si el usuario esta online o no, para
    poner o no el respectivo circulito :p*/
    let isOnline=await client.query(`SELECT online FROM users WHERE username='${theActualOtherUser}'`);
    online.push(onlineCircle.pasteCircleOnline(isOnline.rows[0].online));
    profilePhotosOtherUsers.push(await profilePhoto.getUserProfilePicture(theActualOtherUser));
    lastChatMessages.push(conversations.rows[i].last_message_sent);
    /*Tambien verifico si el usuario solicitante (req.user) tiene nuevos mensajes o no, para poder integrarlo
    en la interfaz de chat en forma de notificacion (circulo rojo con cantidad nuevos mensajes dentro en blanco)*/
    let amountOfNewMessages=await client.query(`SELECT amount FROM new_messages WHERE id_user='${req.user}' AND 
      id_conversation='${conversations.rows[i].id}'`);
    notificationNewMessages.push(amountOfNewMessages); /*Si la cantidad de nuevoes mensajes es cero, no importa, cuando 
    anexe los datos a la plantilla, si es cero, no anexare la notificacion correspondiente*/
  }
  //Y ahora anexo los datos a la plantilla para enviarla al usuario.
  let content='';
  for (let i=0; i<conversations.rowCount; i++){
    content+=`<tr><td><a href="/chat-interface/chat?userName=${users[i]}">${online[i]}<img src="${profilePhotosOtherUsers[i]}"><p>${users[i]}
      </p>${lastChatMessages[i]}</a>`;
    /*Me pregunto si debo modiifcar el codigo en caso de que las notificaiones de nuevos mensajes no existan...
    Bueno, asumo que lo que puede ser es undefined en caso de que el registro de nuevos mensajes del usuario no 
    exista. Lo sabia! Si tengo que modificarlo, asumo que simplemente podria colocar una condicion
    de si la notificacion es indefinida*/
    if (notificationNewMessages[i]!==undefined && notificationNewMessages[i].rows[0]!==undefined){
      if (notificationNewMessages[i].rows[0].amount>0){
        content+=`<div class="newMessages">${notificationNewMessages[i].rows[0].amount}</div>`;
      }
    }
    content+='</td></tr>';
  }
  plantilla=plantilla.replace('<!--#Chat with other users-->', content);
  res.send(plantilla);
}