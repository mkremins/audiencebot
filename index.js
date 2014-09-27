var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(server);

var port = 3000;

app.use(serveStatic('public'));

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('move', function(data){
    console.log(data);
  });
  socket.on('disconnect', function(){
    console.log('a user disconnected');
  });
});

server.listen(port, function(){
  console.log('listening on port ' + port);
});
