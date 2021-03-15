const express=require('express');
const router=express.Router();
const htmlFilePath=__dirname.replace('/routes', '');
const search_users=require('./modules/search-users.js');
const likes=require('./modules/likes.js');
const logged=require('./modules/isLoggedIn.js');

const render_profile_template=require('./modules/render-profile-template.js');

const profilePhotos=require('./modules/other-user-profile-photos.js');

router.get('/', (req, res)=>{
  res.sendFile(htmlFilePath+'/search.html');
});

router.get('/users', logged.isLoggedIn, search_users.searchUsers);

router.get('/users/user-profile', logged.isLoggedIn, async (req, res)=>{
 /*Cuando un usuario que haya inciado sesion quiera visitar el perfil de otro usuario registrado, este 
  sera el codigo que manejara esa peticion.
  Lo que hace es sencillo.
  Se recibe como parametro el nombre del usuario asociado al perfil (en este caso como req.query.userName).
  Luego, se consulta en la base de datos los datos de ese usuario.
  Tambien, se verifica que el usuario que solicita ver el perfil le guste ese perfil (por eso el cuarto parametro)
  Los datos de ese usuario se combinan con la plantilla de perfil de usuario.
  Por ultimo, se envia la plantilla al usuario que hizo la solicitud, mostrandole el perfil correspondiente.*/
  let template=await render_profile_template.renderProfileTemplate(htmlFilePath+'/user-profile.html', req.query.userName, false, req.user);
  res.send(template);
});

router.get('/users/user-profile/photos', logged.isLoggedIn, profilePhotos.photos);

router.put('/users/user-profile/likes', likes);

module.exports=router;