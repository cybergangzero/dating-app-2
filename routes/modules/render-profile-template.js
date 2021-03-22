require('dotenv').config();
const get_user_profile_picture=require('./get-user-profile-picture.js');
const paste_circle_online=require('./paste-circle-online.js');
const fs=require('fs').promises;
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
module.exports.renderProfileTemplate=async (templatePath, userID, requestingUser, userLike='')=>{ /*El tercer parametro (tipo bool) de esta funcion
  definira si se generara el perfil del propio usuario solicitante o el perfil de otro usuario ajeno.
  El cuarto parametro se usuara solo si el tercer parametro es falso. Este servira para verifica que al usuario 
  le gusta el perfil del usuario solicitado.*/
  try{
  	/*Este codigo se encargara de generar el perfil del usuario.
     Nota:Ordenar los datos en la base de datos para reducir este codigo(refactorizar) a un bucle...*/
    //Primero me encargo de la foto de perfil:
    let srcProfilePhoto=await get_user_profile_picture.getUserProfilePicture(userID);
    //Luego de definir la foto de perfil del usuario, empiezo con los demas datos, para poder generar la template.
    let template=await fs.readFile(templatePath, 'utf8');
    /*En la consulta, verifico correo o usuario, porque cuando es el usuario, envia el idUsuario(su correo) y cuando el usuario
    consulta el perfil del otro usuario, se envia el nombre de usuario del perfil consultado, debo corregir esto 
    para que se estandarice como nada mas el nombre del usuario!*/
    if (requestingUser){
      //Hago la consulta de likes y me gusta. Si hay, entonces los anexo como notifiacion (fondo rojo numero blanco)
      let amountOflLikes=await client.query(`SELECT * FROM likes WHERE id_user='${userID}' AND checked_by_the_user='false'`);
      template=template.replace('<!--likes que ha recibido o boton me gusta-->', '<a href="/my-profile/who-liked-you">Usuarios a los que les gustas</a>');
      template=template.replace('<!--Fotos del mismo o fotos de otro usuario-->', '<a href="/my-profile/photos">Fotos</a>');
      template=template.replace('<!--editar perfil o chat-->', '<a href="/my-profile/edit-profile">Editar perfil</a>');
    } else{
      //Verifico si el usuario ha dado me gusta al perfil en cuestion.
      let likeButton, result=await client.query(`SELECT * FROM likes where id_user='${userID}' AND id_user_who_likes='${userLike}'`);
      if (result.rows.length===1){
        //boton color rojo
        likeButton='<button id="like" class="btn btn-danger"><img src="/heart.svg"></button>';
      } else{
        //boton color gris
        likeButton='<button id="like" class="btn btn-secondary"><img src="/heart.svg"></button>';
      }
      template=template.replace('<!--likes que ha recibido o boton me gusta-->', likeButton);
      template=template.replace('<!--Fotos del mismo o fotos de otro usuario-->', '<a id="photos" href="/search/users/user-profile/photos">Fotos</a>');
      template=template.replace('<!--editar perfil o chat-->', '<a id="chat" href="/chat-interface/chat">Mensaje</a>');
    }
    let result=await client.query(`SELECT * FROM users WHERE username='${userID}'`);
    template=template.replace('foto de perfil', srcProfilePhoto);
    template=template.replace('<!--online-->', paste_circle_online.pasteCircleOnline(result.rows[0].online));
    template=template.replace('Pais, Estado, Ciudad', result.rows[0].country);
    template=template.replace('Nombre de usuario', result.rows[0].username);
    let nameAndLastName=result.rows[0].name+' '+result.rows[0].lastname;
    template=template.replace('Nombre y Apellido', nameAndLastName);
    template=template.replace('Encabezado', result.rows[0].header===null? '' : result.rows[0].header);
    template=template.replace('valor', result.rows[0].heigth===null? '' : result.rows[0].heigth);
    template=template.replace('valor', result.rows[0].bodytype===null? '' : result.rows[0].bodytype);
    template=template.replace('valor', result.rows[0].ethnicgroup===null? '' : result.rows[0].ethnicgroup);
    template=template.replace('valor', result.rows[0].maritalstatus===null? '' : result.rows[0].maritalstatus);
    template=template.replace('valor', result.rows[0].sons? 'Yes' : 'No');
    template=template.replace('valor', result.rows[0].housingsituation===null? '' : result.rows[0].housingsituation); 
    template=template.replace('valor', result.rows[0].educationallevel===null? '' : result.rows[0].educationallevel);
    template=template.replace('valor', result.rows[0].work? 'Yes' : 'No');
    template=template.replace('valor', result.rows[0].smokes? 'Yes' : 'No');
    template=template.replace('valor', result.rows[0].drink? 'Yes' : 'No');
    template=template.replace('Descripcion', result.rows[0].description===null? '' : result.rows[0].description);
    return template;
  } catch(err){
    console.log(err);
  	return 'Error';
  }
}