const express=require('express');
const app=express();
const port=8080; //En produccion seria el puerto 443 (https)
const session=require('express-session');
const passport=require('passport');
app.use(session({ secret: "secret", resave: false, saveUninitialized: true })); 
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static('images'));
app.use(express.static('users-photos'));
app.use(express.static('Responsive-Image-Modal'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/croppie', express.static(__dirname + '/node_modules/croppie'));
const index=require('./routes/index.js');
const userProfile=require('./routes/user-profile.js');
const search=require('./routes/search.js');
const accountSettings=require('./routes/account-settings.js');
const chat=require('./routes/chat.js');
app.use('/', index);
app.use('/my-profile', userProfile);
app.use('/search', search);
app.use('/account-settings', accountSettings);
app.use('/chat-interface', chat);

const http=require('http').Server(app);
const io=require('socket.io')(http);
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();

let usersConnectedToChat={};
io.on('connection', socket => {
  socket.on('user online', users => {
    //El respectivo socket se une al room cuya clave sera el id de la conversacion del socket.
    socket.join(users[2]);
    //Se agrega el usuario a la tabla de usuarios conectados.
  	if (!usersConnectedToChat.hasOwnProperty(users[0])){
      Object.defineProperty(usersConnectedToChat, users[0], {value: users[1], enumerable: true, configurable: true});
      socket.user=users[0];
    }
  });
  socket.on('chat message', async msg => {
    /*Como el primer elemento del array "msg" es un objeto que tiene como unica propiedad
    el nombre del usuario que envia el mensaje, y como valor el mensaje propio, solo necesito obtener
    la propiedad de ese objeto con el metodo Object.keys(object), para luego usarlo en la obtencion del mensaje mismo
    invocando la propiedad del objeto, e insertandolo en la base de datos en la tabla messages*/
    let issuingUser=Object.keys(msg[0]);
    issuingUser=issuingUser[0]; //El metodo anterior devuelve un array de propiedades. Al ser una, solo necesito la primera (indice 0)
    let message=msg[0][issuingUser];
  	/*Antes de emitir el mensaje, debo asegurarme de que no sea codigo javascript, por lo que limpiare el mensaje con el
  	siguiente codigo:*/
  	while (message.includes('<script>') || message.includes('</script>')){
  	  message=message.replace('<script>', '');
  	  message=message.replace('</script>', '');
  	}
    let messageToDatabase=message; //Para luego de enviar al cliente, guardar en la base de datos.
    //Envio el mensaje de la forma "usuario: mensaje" al cliente (al respectivo room)
    messageToClient=issuingUser+': '+message;
    io.to(msg[2]).emit('chat message', messageToClient);
    //Anexo el mensaje a la base de datos y tambien se actualiza el ultimo mensaje añadido a la conversacion.
    try{
      let id=msg[2];
      await client.query(`INSERT INTO messages values('${id}', '${issuingUser}', '${messageToDatabase}')`);
      await client.query(`UPDATE conversations SET last_message_sent='${issuingUser+': '+messageToDatabase}' WHERE
        id='${id}'`); 
    } catch(err){
      console.log(err);
      console.log('Error al anexar un mensaje de chat a la base de datos.');
    }
    /*Luego de enviar el mensaje al cliente y guardarlo en la base de datos, proseguire con verificar si sera un nuevo 
    mensaje (no visto) para el usuario receptor*/
    let receivingUser=msg[1], id=msg[2];
    if (!(usersConnectedToChat[receivingUser]===issuingUser)){ //Esto implica que el usuario receptor no esta conectado al chat con el usuario emisor.
      console.log('funciona');
      try{
        /*Primero verifico si existe un registro de nuevos mensajes de esa conversacion para el usuario receptor.
        Si no existe, entonces creo el registro con valor 1. Si existe, solo sumo 1 al registro existente.
        No supe como usar la fucion  "EXIST" de postgresql para verificar si un registro en una tabla existe,
        asi que tendre que usar select, si la cantidad de filas es 0, entonces no existe y debo insertarlo. Me pregunto
        si la alternativa EXIST ofrecera mejor rendimiento...*/
        let consulta=`SELECT * FROM new_messages WHERE id_user='${receivingUser}' AND id_conversation='${id}'`;
        let exist=await client.query(consulta);
        if (exist.rowCount===0){
          await client.query(`INSERT INTO new_messages values('${receivingUser}', '${id}', '1')`);
        } else{
          await client.query(`UPDATE new_messages SET amount=amount+${1} WHERE id_user='${receivingUser}' AND id_conversation='${id}'`)
        }
      } catch(err){
      	console.log(err);
      	console.log('Ha ocurrido un error al momento de guardar un nuevo mensaje no visto para el usuario receptor');
      }
    }
  });
  socket.on('disconnect', ()=>{
  	let x=socket.user;
  	delete usersConnectedToChat[x];
  	delete socket.user;
  });
});

http.listen(port, '0.0.0.0', ()=>{
  console.log('Aplicacion iniciada!');
});