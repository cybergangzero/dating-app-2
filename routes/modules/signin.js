require('dotenv').config();
const {Client}=require('pg');
const client=new Client({
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,   
});
client.connect();
const bcrypt=require('bcrypt');
const saltRounds=10;
const getAge=require('age-by-birthdate');


module.exports.signin=async (req, res)=>{
  if (req.body.sex==='man'){
    req.body.sex=1;
  } else {
  	req.body.sex=0;
  }
  try{
  	//Compruebo si ya esta ese correo o nombre de usuario registrado.
  	let comprobacionDeUsername=await client.query(`SELECT EXISTS (SELECT * FROM users WHERE username='${req.body.username}')`);
  	if (!comprobacionDeUsername.rows[0].exists){
      bcrypt.genSalt(saltRounds, (err, salt)=>{
        if (err) throw err;
        bcrypt.hash(req.body.password, salt, async (err, hash)=>{
          if (err) throw err;
          //Hasheo y agrego salt a la contraseña para almacenarla en la base de datos.
          let hashedPassword=hash;
          //Luego inserto la contraseña hasheada junto al resto de los datos a la base de datos para crear al nuevo usuario.
          let registroDeNuevoUsuario=`INSERT INTO users (username, password, name, lastName, sex, date_of_birth, age, country) values('${req.body.username}', '${hashedPassword}', 
            '${req.body.name}', '${req.body.lastName}', '${req.body.sex}', '${req.body.dateOfBirth}', '${getAge(req.body.dateOfBirth)}', '${req.body.country}')`;
          await client.query(registroDeNuevoUsuario);
          console.log('Nuevo usuario registrado');
          res.redirect('/succesful-sign-up');
        });
      });
  	} else{
  	  res.redirect('/error:sign-up-failed');
  	}
  } catch(err){
    console.log(err);
    res.redirect('/error:sign-up-failed');
  }
}