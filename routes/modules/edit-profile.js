const db=require('./pgpool.js');
const pool=db.getPool();
exports.editProfile=async (req, res)=>{
  try{
    /*Antes de insertar el encabezado y la descripcion, debo validar esos datos.
    postgres, por ejemplo, guarda comiilas (') si cada comilla se representa como doble. 
    Aqui un ejemplo:*/
    const client=await pool.connect();
    for (let i=0; i<req.body.encabezado.length; i++){
      if (req.body.encabezado[i]==="'"){
        req.body.encabezado=req.body.encabezado.replace(req.body.encabezado[i], "''");
        i++;
      }
    }
    for (let j=0; j<req.body.descripcion.length; j++){
      if (req.body.descripcion[j]==="'"){
        req.body.descripcion=req.body.descripcion.replace(req.body.descripcion[j], "''");
        j++;
      }
    }
  	let consulta=`UPDATE users SET header='${req.body.encabezado}', bodytype='${req.body.tipoDeCuerpo}', heigth='${req.body.altura}',
  	 ethnicgroup='${req.body.grupoEtnico}', maritalstatus='${req.body.estadoCivil}', sons='${req.body.hijos}', housingsituation='${req.body.
  	 situacionDeVivienda}', educationallevel='${req.body.nivelDeEstudios}', work='${req.body.trabaja}', smokes='${req.body.fuma}', drink='${req.body.bebe}',
  	 description='${req.body.descripcion}' WHERE username='${req.user}'`;
    await client.query(consulta);
    res.json({message:'Actualizacion exitosa'});
    client.release();
  } catch(err){
    client.release(); //En caso de que el error no este relacionado a la adquisicion de la conexion, lo cual es lo mas probable...
  	res.json({message:'Error, intentelo de nuevo.'});
  }
}