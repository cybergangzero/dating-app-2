const fs=require('fs').promises;
const db=require('./pgpool.js');
const pool=db.getPool();
exports.changeProfilePhoto=async (req, res)=>{
  try{
    const client=await pool.connect();
  	const etiquetaFotoDePerfil='etiquetaFotoDePerfilxxxxx';
  	await fs.opendir(`users-photos/${req.user}`);
  	let fotosDelUsuario=await fs.readdir(`users-photos/${req.user}`);
  	//Si hay una foto de perfil establecida, entonces le quito su etiqueta, para ponersela a la nueva foto elegida.
  	let i=0, flag=false;
  	while (i<fotosDelUsuario.length && !flag){
  	  if (fotosDelUsuario[i].includes(etiquetaFotoDePerfil)){ //El metodo includes devuelve true si encuentra una subcadena dentro de una cadena, false en caso contrario.
  	    await fs.rename(`users-photos/${req.user}/${fotosDelUsuario[i]}`, `users-photos/${req.user}/${fotosDelUsuario[i].replace(etiquetaFotoDePerfil, '')}`);
  	    flag=true;
  	  }
  	  i++;
  	}
  	await fs.rename(`users-photos/${req.user}/${req.body.src}`, `users-photos/${req.user}/${req.body.src+etiquetaFotoDePerfil}`);
    await client.query(`UPDATE users SET src_profile_photo='/${req.user}/${req.body.src+etiquetaFotoDePerfil}' WHERE username='${req.user}'`);
    res.json({message: 'Foto de perfil cambiada!'});
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
    res.json({message: 'Error en la operacion!'});
  }
}