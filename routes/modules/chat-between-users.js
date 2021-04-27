const get_user_profile_picture=require('./get-user-profile-picture.js');
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
const fs=require('fs').promises;
const db=require('./pgpool.js');
const pool=db.getPool();
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
    const client=await pool.connect();
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
    let conversation=await client.query(`SELECT * FROM conversations WHERE id_user_a='${order[0]}' AND id_user_b='${order[1]}'`);
    if (conversation.rows.length===0){
      /*Se crea la conversacion en la base de datos entre los dos usuarios. Debo verificar si el 
      resultado de insertar tambien devuelve el resultado de la insercion como registro, y tambien puedo obtener
      el id sin tener que consultar de nuevo*/
      conversation=await client.query(`INSERT INTO conversations (id_user_a, id_user_b) values ('${order[0]}', '${order[1]}') RETURNING id`);
      //RETURNING {columnas}en postresql, sirve para retornar valores despues de consulta de manipulacion, como select, insert y update
    }
    /*No menos importante, la verificacion de si el usuario solicitante tiene mensajes no vistos en esa conversacion
    Simplemente hago un query. Si hay nuevos mensajes (amount>0) lo actualizo a 0.*/
    try{
      let consulta=`SELECT amount FROM new_messages WHERE id_user='${req.user}' AND id_conversation='${conversation.rows[0].id}'`;
      let areThereMessages=await client.query(consulta);
      if (areThereMessages.rowCount===1 && areThereMessages.rows[0].amount>0){
        await client.query(`UPDATE new_messages SET amount=0 WHERE id_user='${req.user}' AND id_conversation='${conversation.rows[0].id}'`)
      }
    } catch(err){
      console.log(err);
    }
    //Y el toque final, enviar el id de la conversacion al usuario solicitante (vale la pena recordarlo)
    plantilla=plantilla.replace('<!--id_conversation-->', `<div id="${conversation.rows[0].id}"></div>`);
    res.send(plantilla);
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
    res.send('Ha ocurrido un error. Por favor, intentelo de nuevo.');
  }
}