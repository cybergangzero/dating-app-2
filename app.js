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
  	if (!usersConnectedToChat.hasOwnProperty(users[0])){
      Object.defineProperty(usersConnectedToChat, users[0], {value: users[1], enumerable: true, configurable: true});
      socket.user=users[0];
    }
  });
  socket.on('chat message', async msg => {
    /*Como el primer elemento del array "msg" es un objeto que tiene como unica propiedad
    el nombre del usuario que envia el mensaje, y como valor el mensaje propio, solo necesito obtener
    la propiedad del ese objeto con el metodo Object.keys(object), para luego usarlo en la obtencion del mensaje mismo
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
    //Envio el mensaje de la forma "usuario: mensaje" al cliente
    messageToClient=issuingUser+': '+message;
    io.emit('chat message', messageToClient);
    //Anexo el mensaje a la base de datos
    try{
      let id=msg[2];
      await client.query(`INSERT INTO messages values('${id}', '${issuingUser}', '${messageToDatabase}')`); 
    } catch(err){
      console.log(err);
      console.log('Error al anexar un mensaje de chat a la base de datos.');
    }
    /*let resultChatFile=await read_chat_file.readChatFile(get.getUsernameFromMsg(msg[0]), msg[1], false);
    if (resultChatFile!==''){
      try{
        await fs.appendFile(`chats/${resultChatFile}.txt`, `<li>${msg[0]}</li>\n`);
      } catch(err){
        throw err;
      }
    }*/
    /*El siguiente codigo sirve para, en caso de que el usuario receptor no este conectado al mismo chat que el usuario
    emisor, aumentar en 1 la cantidad de nuevos mensajes del usuario receptor en esa conversacion*/
    //let issuingUser=get.getUsernameFromMsg(msg[0]), receivingUser=msg[1];
    /*if (!(usersConnectedToChat.receivingUser===issuingUser)){ //Esto implica que el usuario receptor no esta conectado al chat con el usuario emisor.
      try{
        await fs.stat(`chats/new-messages/${receivingUser}.txt`);
        let content=await fs.readFile(`./chats/new-messages/${receivingUser}.txt`, 'utf8');
        if (!content.includes(issuingUser)){
          await fs.appendFile(`./chats/new-messages/${receivingUser}.txt`, issuingUser+': 0\n');
        }
        new_chat_messages.newChatMessages(issuingUser, receivingUser);
      } catch(err){
        if (err.code==='ENOENT'){
          await fs.appendFile(`./chats/new-messages/${receivingUser}.txt`, '');
          await fs.appendFile(`./chats/new-messages/${receivingUser}.txt`, issuingUser+': 0\n');
          new_chat_messages.newChatMessages(issuingUser, receivingUser);
        }
      }
    }*/
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