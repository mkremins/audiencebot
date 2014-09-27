function identity(x){ return x; }
function get(prop){ return function(obj){ return obj[prop]; }; }

var width = 100;
var height = 100;
var radius = 5;

var consensus = {x: width/2, y: height/2, id: 'consensus'};
var vote = {x: width/2, y: height/2, id: 'self'};

var socket = io();
socket.on('consensus changed', function(data){
  console.log('new consensus: ' + data.x + ', ' + data.y);
  consensus.x = data.x;
  consensus.y = data.y;
  updateView([consensus, vote]);
});

var drag = d3.behavior.drag()
  .origin(identity)
  .on('drag', function(d){
    if (d.id === 'self') {
      d3.select(this)
          .attr('cx', d.x = Math.max(radius, Math.min(width - radius, d3.event.x)))
          .attr('cy', d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));
    }
  })
  .on('dragend', function(d){
    if (d.id === 'self') {
      vote.x = d.x;
      vote.y = d.y;
      socket.emit('vote changed', {x: vote.x, y: vote.y});
      updateView([consensus, vote]);
    }
  });

function updateView(data){
  var sel = d3.select('svg').selectAll('circle').data(data, get('id'));
  sel.enter().append('circle').call(drag);
  sel.attr('cx', get('x')).attr('cy', get('y')).attr('r', radius)
     .attr('fill', function(d){ return d.id === 'self' ? 'red' : 'black'; });
  sel.exit().remove();
}

d3.select('svg').attr('width', screen.width).attr('height', screen.width);
updateView([consensus, vote]);