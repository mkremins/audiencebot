var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(server);
var osc = require('node-osc');
var config = require('./config');

app.use(serveStatic('public'));

var votes = {};
var consensus = {x: 50, y: 50};
var oscClient = new osc.Client(config.oscRemoteAddress, config.oscRemotePort);

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
  socket.broadcast.emit('client connected', {id: socket.id, x: 50, y: 50});
  socket.emit('consensus changed', consensus);
  for (var voter in votes) {
    socket.emit('client connected', votes[voter]);
  }

  socket.on('vote changed', function(vote){
    console.log(socket.id + ': ' + vote.x + ', ' + vote.y);

    // calculate delta
    var prevVote = votes[socket.id] || {id: socket.id, x: 50, y: 50};
    var delta = {x: vote.x - prevVote.x, y: vote.y - prevVote.y};

    // calculate new consensus
    vote.id = socket.id;
    votes[socket.id] = vote;
    consensus = calculateConsensus(votes);

    // calculate overcorrection
    var numVoters = Object.keys(votes).length;
    var overshoot = {x: delta.x / numVoters, y: delta.y / numVoters};
    var extreme = {x: consensus.x + overshoot.x, y: consensus.y + overshoot.y};

    // broadcast changes
    socket.broadcast.emit('vote changed', vote);
    io.emit('consensus changed', extreme); // TEMPORARY HACK TO TEST EXTREME
    oscClient.send(new osc.Message('/consensus', consensus.x, consensus.y));
    oscClient.send(new osc.Message('/extreme', extreme.x, extreme.y));
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ': disconnected');

    // calculate new consensus
    delete votes[socket.id];
    consensus = calculateConsensus(votes);

    // broadcast changes
    socket.broadcast.emit('client disconnected', {id: socket.id});
    io.emit('consensus changed', consensus);
    oscClient.send(new osc.Message('/consensus', consensus.x, consensus.y));
  });
});

server.listen(config.port, function(){
  console.log('listening on port ' + config.port);
});
