var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(server);
var osc = require('node-osc');

var port = 3000;

app.use(serveStatic('public'));

var votes = {};
var consensus = {x: 50, y: 50};
var oscClient = new osc.Client('127.0.0.1', 3333);

function calculateConsensus(votes){
  var totalX = 0, totalY = 0, voteCount = 0;
  for (var key in votes) {
    totalX += votes[key].x;
    totalY += votes[key].y;
    voteCount++;
  }
  return {x: totalX / voteCount, y: totalY / voteCount};
}

function updateConsensus(votes){
  consensus = calculateConsensus(votes);
  io.emit('consensus changed', consensus);
  oscClient.send(new osc.Message('/consensus', consensus.x, consensus.y));
}

io.on('connection', function(socket){
  console.log(socket.id + ': connected');
  socket.broadcast.emit('client connected', {id: socket.id, x: 50, y: 50});
  socket.emit('consensus changed', consensus);
  for (var voter in votes) {
    socket.emit('client connected', votes[voter]);
  }

  socket.on('vote changed', function(data){
    console.log(socket.id + ': ' + data.x + ', ' + data.y);
    data.id = socket.id;
    socket.broadcast.emit('vote changed', data);
    votes[socket.id] = data;
    updateConsensus(votes);
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ': disconnected');
    socket.broadcast.emit('client disconnected', {id: socket.id});
    delete votes[socket.id];
    updateConsensus(votes);
  });
});

server.listen(port, function(){
  console.log('listening on port ' + port);
});
