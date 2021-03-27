require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
const fs=require('fs').promises;
const getProfilePhoto=require('./get-user-profile-picture.js');
const onlineCircle=require('./paste-circle-online.js');
const getAge=require('age-by-birthdate'); //Por si no he actualizado la edad de los usuarios. La actualizo cada mes haciendo revision de las fechas de nacimiento de los usuarios.
exports.searchUsers=async (req, res)=>{
  /*Consulto el sexo del usuario para luego consultar todos los usuarios del sexo opuesto.
  Los mostrare en filas de 3. Cada perfil de usuario tendra como presentacion su banderita, estado, foto de perfil (avatar si no la tiene),
  su nombre de usuario y su edad. Si el usuario hace click en alguno de los perfiles, ira directamente al perfil indicado con todos 
  sus datos. Los parametros de busqueda seran el rango de edad, el pais y si estan online. En caso de que sean todos los paises,
  no incluyo eso  parametro en la consulta a la base de datos.
  Cada perfil sera un link en si mismo (a href) y lo unire junto a un parametro(en este caso el nombre de usuario) para que el usuario
  solicitante pueda ver el respectivo perfil...*/
  try{
    let sexo=await client.query(`SELECT sex FROM users WHERE username='${req.user}'`), perfilesDeUsuarios;
    if (req.query.pais==='Todos los paises'){
      if (req.query.online==='true'){
        perfilesDeUsuarios=await client.query(`SELECT * FROM users WHERE sex='${!sexo.rows[0].sex}' AND age<='${req.query.edad}' AND online=true`);
      } else{
        perfilesDeUsuarios=await client.query(`SELECT * FROM users WHERE sex='${!sexo.rows[0].sex}' AND age<='${req.query.edad}'`);
      }
    } else{
        if (req.query.online==='true'){
          //onlineCircle='<div id="online-circle"></div>';
          perfilesDeUsuarios=await client.query(`SELECT * FROM users WHERE sex='${!sexo.rows[0].sex}' AND age<='${req.query.edad}'
          AND country='${req.query.pais}' AND online=true`);
        } else{
          perfilesDeUsuarios=await client.query(`SELECT * FROM users WHERE sex='${!sexo.rows[0].sex}' AND age<='${req.query.edad}'
          AND country='${req.query.pais}'`);
        }
    }
    res.json({results: perfilesDeUsuarios});
  } catch(err){
  	console.log(err);
    res.send('Ha ocurrido un error. Intentelo de nuevo');
  }
}