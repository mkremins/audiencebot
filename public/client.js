function identity(x){ return x; }
function get(prop){ return function(obj){ return obj[prop]; }; }

var width = 100;
var height = 100;
var radius = 5;

var consensus = {x: width/2, y: height/2, id: 'consensus'};
var vote = {x: width/2, y: height/2, id: 'self'};
var votes = [];

function currentState(){
  return votes.concat(consensus, vote);
}

var socket = io();
socket.on('consensus changed', function(data){
  console.log('new consensus: ' + data.x + ', ' + data.y);
  consensus.x = data.x;
  consensus.y = data.y;
  updateView(currentState());
});
socket.on('client connected', function(data){
  votes.push(data);
  updateView(currentState());
});
socket.on('client disconnected', function(data){
  votes = votes.filter(function(d){ return d.id !== data.id; });
  updateView(currentState());
});
socket.on('vote changed', function(data){
  votes = votes.filter(function(d){ return d.id !== data.id; });
  votes.push(data);
  updateView(currentState());
});

var drag = d3.behavior.drag().origin(identity);
drag.on('drag', function(d){
  if (d.id === 'self') {
    d3.select(this)
        .attr('cx', d.x = Math.max(radius, Math.min(width - radius, d3.event.x)))
        .attr('cy', d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));
  }
});
drag.on('dragend', function(d){
  if (d.id === 'self') {
    vote.x = d.x;
    vote.y = d.y;
    socket.emit('vote changed', {x: vote.x, y: vote.y});
    updateView(currentState());
  }
});

function updateView(data){
  var sel = d3.select('svg').selectAll('circle').data(data, get('id'));
  sel.enter().append('circle').call(drag);
  sel.attr('fill', function(d){ return d.id === 'self' ? 'red' : 'black'; })
     .attr('r', function(d){ return d.id === 'consensus' ? 7.5 : radius; })
     .transition()
       .duration(function(d){ return d.id === 'self' ? 0 :
                                     d.id === 'consensus' ? 2000 : 1000; })
       .attr('cx', get('x'))
       .attr('cy', get('y'));
  sel.exit().remove();
}

d3.select('svg').attr('width', screen.width).attr('height', screen.width);
updateView(currentState());
