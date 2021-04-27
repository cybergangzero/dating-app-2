const express=require('express');
const app=express();
const winston=require('winston');
const expressWinston=require('express-winston');
const port=5000; 
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
app.use('/dist', express.static(__dirname + '/node_modules/js-datepicker/dist'));
const index=require('./routes/index.js');
const userProfile=require('./routes/user-profile.js');
const search=require('./routes/search.js');
const accountSettings=require('./routes/account-settings.js');
const chat=require('./routes/chat.js');

app.use(expressWinston.logger({
      transports: [
        new winston.transports.File({
          filename: 'registration-of-request.log'
        })
      ],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
      meta: true, // optional: control whether you want to log the meta data about the request (default to true)
      dynamicMeta: function(req, res) {
        return {
         ip: req.ip,
         date: Date(),
         user: req.user? req.user: null
        }
      },
      msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
      expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
      colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
      ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
}));

app.use('/', index);
app.use('/my-profile', userProfile);
app.use('/search', search);
app.use('/account-settings', accountSettings);
app.use('/chat-interface', chat);

const http=require('http').Server(app);
const io=require('socket.io')(http);
const db=require('./routes/modules/pgpool.js');
const pool=db.getPool();
const validator=require('validator');

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
    const client=await pool.connect();
    /*Como el primer elemento del array "msg" es un objeto que tiene como unica propiedad
    el nombre del usuario que envia el mensaje, y como valor el mensaje propio, solo necesito obtener
    la propiedad de ese objeto con el metodo Object.keys(object), para luego usarlo en la obtencion del mensaje mismo
    invocando la propiedad del objeto, e insertandolo en la base de datos en la tabla messages*/
    let issuingUser=Object.keys(msg[0]);
    issuingUser=issuingUser[0]; //El metodo anterior devuelve un array de propiedades. Al ser una, solo necesito la primera (indice 0)
    let message=msg[0][issuingUser];
  	/*Antes de emitir el mensaje, debo asegurarme de que no sea codigo javascript (y no tenga 
    caracteres especiales para evitar ataques de inyeccion sql, por lo que limpiare el mensaje con el
  	siguiente codigo:*/
  	while (message.includes('<script>') || message.includes('</script>')){
  	  message=message.replace('<script>', '');
  	  message=message.replace('</script>', '');
  	}
    message=validator.escape(message);
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
    client.release();
  });
  socket.on('disconnect', ()=>{
  	let x=socket.user;
  	delete usersConnectedToChat[x];
  	delete socket.user;
  });
});

app.use(expressWinston.errorLogger({
  transports: [
    new winston.transports.File({
      filename: 'error.log'
    })
  ],
  format: winston.format.combine(
    winston.format.json()
  ),
  dynamicMeta: function(req, res) {
    return {
      ip: req.ip,
      date: Date(),
      user: req.user? req.user: null
    }
  }
}));

http.listen(port, '0.0.0.0', ()=>{
  console.log('Aplicacion iniciada!');
});