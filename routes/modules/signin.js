const db=require('./pgpool.js');
const pool=db.getPool();
const bcrypt=require('bcrypt');
const saltRounds=10;
const getAge=require('age-by-birthdate');
const cryptoRandomString=require('crypto-random-string');
let htmlFilePath=__dirname.replace('/routes', ''); htmlFilePath=htmlFilePath.replace('/modules', '');
const fs=require('fs').promises;

module.exports.signin=async (req, res)=>{
  if (req.body.sex==='man'){
    req.body.sex=1;
  } else {
  	req.body.sex=0;
  }
  try{
    const client=await pool.connect();
  	//Compruebo si ya esta ese correo o nombre de usuario registrado.
  	let comprobacionDeUsername=await client.query(`SELECT EXISTS (SELECT * FROM users WHERE username='${req.body.username}')`);
  	if (!comprobacionDeUsername.rows[0].exists){
      bcrypt.genSalt(saltRounds, (err, salt)=>{
        if (err) throw err;
        bcrypt.hash(req.body.password, salt, async (err, hash)=>{
          if (err) throw err;
          //Hasheo y agrego salt a la contraseña para almacenarla en la base de datos.
          let hashedPassword=hash;
          //Tambien genero el codigo de recuperacion de contraseña del usuario.
          let recoveryCode=cryptoRandomString({length: 10});
          //Luego inserto la contraseña hasheada y el codigo generado junto al resto de los datos a la base de datos para crear al nuevo usuario.
          let registroDeNuevoUsuario=`INSERT INTO users (username, password, name, last_name, sex, date_of_birth, age, country, src_profile_photo, recovery_code) values('${req.body.username}', '${hashedPassword}', 
            '${req.body.name}', '${req.body.lastName}', '${req.body.sex}', '${req.body.dateOfBirth}', '${getAge(req.body.dateOfBirth)}', 
            '${req.body.country}', '${req.body.sex? '/default-avatars/male.jpeg' : '/default-avatars/female.jpeg'}', '${recoveryCode}')`;
          await client.query(registroDeNuevoUsuario);
          console.log('Nuevo usuario registrado');
          let template=await fs.readFile(htmlFilePath+'/successful-sign-up.html', 'utf8');
          template=template.replace('<!--username-->', `username: ${req.body.username}`);
          template=template.replace('<!--password-->', `password: ${req.body.password}`);
          template=template.replace('<!--recovery code-->', `Code to recover your account in case you forget your password: ${recoveryCode}`);
          res.send(template);
          /*res.send(`Succesful sign up! Now you can login in our website ;)\n Your credentials are:\n username: ${req.body.username}\n
          	password: ${req.body.password}\n
          	Code to recover your account in case you forget your password: ${hashedPassword}\n
          	Please make sure to copy your credentials and save them, especially the recovery code, 
          	because if you don't have it, you won't be able to recover your account in case you forget your password.`);*/
        });
      });
  	} else{
  	  res.send('Error: Sing up failed :( Please, try again with valid data');
  	}
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
    console.log(err);
    res.send('Error: Sing up failed :( Please, try again with valid data');
  }
}