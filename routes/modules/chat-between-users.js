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
  try{
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
    let messages, conversation=await client.query(`SELECT * FROM conversations WHERE id_user_a='${order[0]}' AND id_user_b='${order[1]}'`);
    if (conversation.rows.length===1){
      messages=await client.query(`SELECT * FROM messages where id_conversation=${conversation.rows[0].id}`);
    } else{
  	  /*Se crea la conversacion en la base de datos entre los dos usuarios. Debo verificar si el 
  	  resultado de insertar tambien devuelve el resultado de la insercion como registro, y tambien puedo obtener
  	  el id sin tener que consultar de nuevo*/
  	  conversation=await client.query(`INSERT INTO conversations (id_user_a, id_user_b) values ('${order[0]}', '${order[1]}')`);
    }
    if (messages!==undefined && messages.rows.length!==0){
  	  let conversation_content=';'
      /*Acerca de este bucle... me pregunto si podria ser fuente de un cuello de botella...
      Quiero decir, si de repente 15 usuarios solicitaran un chat con algun otro, y tales chats tengan
      1000 mensajes o mas, eso me daria una cantidad de 15000 repeticiones al mismo tiempo. O(15000)
      seria la complejida en este caso. A mayor escala esto podria dar problemas...
      Por cierto, debo implementar la funcionalidad que sirva para posicionar la pantalla en
      los ultimos mensajes. Esto evita al usuario la incomodida de tener que bajarla el mismo.
      Algo mas, otro cuello de botella podria ser la busqueda. Imagino que haya 10000 usuarios registrados, y
      15 usuarios quisieran visualizar todos esos usuarios. O(150000) en este caso. Creo que tendre que implementar
      la busqeuda de manera parcial, por sub indices, eso evitaria la carga al servidor...*/
      for (let i=0; i<messages.rowCount; i++){
        conversation_content+=`<li>${messages.rows[i].id_user}: ${messages.rows[i].message}</li>`;
      }
      plantilla=plantilla.replace('<!--messages-->', conversation_content);
    }
    //Y el toque final, enviar el id de la conversacion al usuario solicitante (vale la pena recordarlo)
    plantilla=plantilla.replace('<!--id_conversation-->', `<div id="${conversation.rows[0].id}"></div>`);
    res.send(plantilla);
  } catch(err){
  	console.log(err);
    res.send('Ha ocurrido un error. Por favor, intentelo de nuevo.');
  }
}