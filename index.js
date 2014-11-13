var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');
var io = require('socket.io')(server);
var osc = require('node-osc');
var config = require('./config');

app.use(serveStatic('public'));

var votes = {};

var consensus = {x: 50, y: 50};
var offset    = {x: 0, y: 0};
var overshoot = {x: 50, y: 50};

var oscClient = new osc.Client(config.oscRemoteAddress, config.oscRemotePort);

function calculateConsensus(votes){
  var totalX = 0, totalY = 0, voteCount = Object.keys(votes).length;
  for (var key in votes) {
    totalX += votes[key].x;
    totalY += votes[key].y;
  }
  return {x: totalX / voteCount, y: totalY / voteCount};
}

setInterval(function(){
  overshoot = {x: consensus.x + offset.x, y: consensus.y + offset.y};
  io.emit('consensus changed', overshoot);
  oscClient.send(new osc.Message('/x', overshoot.x));
  oscClient.send(new osc.Message('/y', overshoot.y));
  offset = {x: offset.x / 2, y: offset.y / 2};
  console.log(overshoot);
}, 100);

io.on('connection', function(socket){
  console.log(socket.id + ': connected');
  socket.broadcast.emit('client connected', {id: socket.id, x: 50, y: 50});
  socket.emit('consensus changed', overshoot);
  for (var voter in votes) {
    socket.emit('client connected', votes[voter]);
  }

  socket.on('vote changed', function(vote){
    //console.log(socket.id + ': ' + vote.x + ', ' + vote.y);

    // calculate delta
    var prevVote = votes[socket.id] || {id: socket.id, x: 50, y: 50};
    var delta = {x: vote.x - prevVote.x, y: vote.y - prevVote.y};

    // calculate new consensus
    vote.id = socket.id;
    votes[socket.id] = vote;
    consensus = calculateConsensus(votes);

    // add impulse to offset
    var numVoters = Object.keys(votes).length;
    offset.x += delta.x / numVoters;
    offset.y += delta.y / numVoters;

    socket.broadcast.emit('vote changed', vote);
  });

  socket.on('disconnect', function(){
    console.log(socket.id + ': disconnected');
    delete votes[socket.id];
    consensus = calculateConsensus(votes);
    socket.broadcast.emit('client disconnected', {id: socket.id});
  });
});

server.listen(config.port, function(){
  console.log('listening on port ' + config.port);
});
