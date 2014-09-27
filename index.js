var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(server);

var port = 3000;

app.use(serveStatic('public'));

var votes = {};
var consensus = {x: 50, y: 50};

function calculateConsensus(votes){
  var totalX = 0, totalY = 0, voteCount = 0;
  for (var key in votes) {
    totalX += votes[key].x;
    totalY += votes[key].y;
    voteCount++;
  }
  return {x: totalX / voteCount, y: totalY / voteCount};
}

io.on('connection', function(socket){
  console.log(socket.id + ': connected');

  socket.on('vote changed', function(data){
    console.log(socket.id + ': ' + data.x + ', ' + data.y);
    votes[socket.id] = data;
    consensus = calculateConsensus(votes);
    io.emit('consensus changed', consensus);
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ': disconnected');
    delete votes[socket.id];
    consensus = calculateConsensus(votes);
    io.emit('consensus changed', consensus);
  });
});

server.listen(port, function(){
  console.log('listening on port ' + port);
});
