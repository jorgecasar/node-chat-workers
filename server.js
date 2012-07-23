var fs     = require('fs');
var server = require('http').createServer(handler);
var io     = require('socket.io').listen(server);
var port   = process.env.PORT || 8080;
var users  =  [];

server.listen(port, function(){
  console.log('Server started at :' + port + '...');
});

function handler (req, res) {
  var file = __dirname + req.url;
  if( req.url == '/')
  {
    file = __dirname + '/index.html';
  }
  fs.readFile(file,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + __dirname + req.url);
      }

      res.writeHead(200);
      res.end(data);
    });
}

io.sockets.on('connection', function (socket) {
  socket.on('set nickname', function (nickname, callback) {
    var is_new_user = users.indexOf(nickname) == -1;
    console.log('New user (', nickname ,') -> ', is_new_user);
    if( is_new_user )
    {
      socket.nickname = nickname;
      users.push(nickname);
      console.log('Welcome: ', nickname);
      io.sockets.emit('welcome', { nickname: nickname, users: users } );
    }
    callback(is_new_user);
  });

  socket.on('disconnect', function () {
    var nickname = socket.nickname;
    if ( nickname ) {
      users.splice(users.indexOf(nickname), 1);
      console.log('Goodbye: ', nickname);
      socket.broadcast.emit('goodbye', { nickname: nickname} );
    }
  });

  socket.on('msg', function (data) {
    var nickname = socket.nickname;
    if ( nickname ) {
      data.nickname = nickname;
      console.log('Chat message', data);
      io.sockets.emit('msg', data);
    }
  });



});