require('dotenv').config();
/*Este modulo servira para usar el pool de conexiones en los distintos modulos y rutas que necesiten usarlo.
 Fue una recomendacion directa de un usuario de stackoverflow. Otra opcion sera usar el pool de conexiones como variable global
 en el archivo "app.js", pero esta solucion no requiere uso de variables globales.
fuente del siguiente codigo: https://stackoverflow.com/questions/38747875/how-to-share-connection-pool-between-modules-in-node-js*/
var pg = require('pg');
var pool;
var config = {
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST, 
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}

//Yo, me pregunto... si los valores para los parametros max, idleTimeoutMillis y connectionTimeoutMillis son los correctos...

module.exports = {
    getPool: function () {
      if (pool) return pool; // if it is already there, grab it here
      pool = new pg.Pool(config);
      return pool;
    }
}