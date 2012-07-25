// requerimos el objeto "fileSystem".
var fs     = require('fs');
// Creamos el servidor y le indicamos el escuchador de la conexión.
var server = require('http').createServer(handler);
// Creamos el socket y lo asociamos al servidor creado.
var io     = require('socket.io').listen(server);
// Declaramos el puero de escucha.
// Usamos la variable de servidor o el que elijamos.
var port   = process.env.PORT || 8080;
// Declaramos la lista de usuarios.
var users  = [];

// Declaramos un
var contentTypesByExtension = {
    'txt': "text/plain",
    'html': "text/html",
    'js': "text/javascript",
    'css': "text/css"
};

// Indicamos el puerto de escucha e indicamos el callback.
server.listen(port, function(){
  console.log('Server started at :' + port + '...');
});

// Función que administra las peticiones y envia las respuestas.
function handler (req, res) {
  // Cuando se solicite el root devolvemos el index.html
  if( req.url == '/')
  {
    req.url += '/index.html';
  }
  // Generamos la ruta del fichero solicitado.
  var file = __dirname + req.url;
  // obtenemos la extensión
  var ext = req.url.match(/\.([^\.]+)$/);
  if( ext )
  {
    ext = ext[1];
  }
  else
  {
    // Por defecto establecemos txt.
    ext = 'txt';
  }
  // Leemos el fichero solicitado.
  fs.readFile(file, function (err, data) {
    // En caso de error devolvemos un estado 500.
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + file);
    }
    // Devolvermos estado 200 y el contenido del fichero.
    res.writeHead(200, {
      'Content-Type': contentTypesByExtension[ext],
      'Content-Length': data.length
    });
    res.end(data);
  });
}
// Capturamos el evento de conexión de un socket
io.sockets.on('connection', function (socket) {
  // por cada nueva conexión asociamos los mensajes a escuchar.
  // Escuchamos el mensaje de establecer el nombre de usuario.
  socket.on('set nickname', function (nickname, callback) {
    // Comprobamos que no esté en la lista de usuarios.
    var is_new_user = users.indexOf(nickname) == -1;
    // Si es un nuevo usuario
    if( is_new_user )
    {
      // asociamos el nickname al socket.
      socket.nickname = nickname;
      // añadimos el nickname a la lista de usuarios.
      users.push(nickname);
      // ordenamos la lista de usuarios.
      users.sort();
      // añadimos al log de servidor la acción
      console.log('[connect] ', nickname);
      // Notificamos a todos los sockets (incluido al que envia el mensaje).
      io.sockets.emit('welcome', { nickname: nickname, users: users } );
    }
    // Llamamos la función de callback indicanda en cliente.
    callback(is_new_user, nickname);
  });

  // Escuchamos la desconexión de un socket.
  socket.on('disconnect', function () {
    // guardamos el nombre de usuario del socket desconectado.
    var nickname = socket.nickname;
    // Comprobamos que tiene un nickname asociado.
    if ( nickname ) {
      // Eliminamos el usuario de la lista
      users.splice(users.indexOf(nickname), 1);
      // añadimos al log de servidor la acción
      console.log('[disconnect]: ', nickname);
      // Notificamos a todos los sockets (NO incluido al que envía el mensaje).
      socket.broadcast.emit('goodbye', { nickname: nickname, users: users } );
    }
  });

  // Escuchamos el envío de mensaje.
  socket.on('msg', function (data) {
    // Guaramos el usuario que lo envía.
    var nickname = socket.nickname;
    // Comprobamos que tiene nombre de usuario.
    if ( nickname ) {
      // Asociamos el nombre de usuario a los datos del mensaje.
      data.nickname = nickname;
      // añadimos al log de servidor la acción
      console.log('[message]', data);
      // Notificamos a todos los sockets (incluido al que envia el mensaje).
      io.sockets.emit('msg', data);
    }
  });
});