// set up comms
var socket = io();
socket.on('consensus changed', function(data){
  console.log('new consensus: ' + data.x + ', ' + data.y);
});

// view config
var width = 100;
var height = 100;
var radius = 5;

// set up drag behavior
var drag = d3.behavior.drag()
  .on('drag', function(){
    d3.select(this)
        .attr('cx', Math.max(radius, Math.min(width - radius, d3.event.x)))
        .attr('cy', Math.max(radius, Math.min(height - radius, d3.event.y)));
  })
  .on('dragend', function(){
    var x = d3.select(this).attr('cx');
    var y = d3.select(this).attr('cy');
    socket.emit('vote changed', {x: parseFloat(x), y: parseFloat(y)});
  });

// set up view
d3.select('svg')
    .attr('width', screen.width).attr('height', screen.width)
  .append('circle')
    .attr('cx', width/2).attr('cy', height/2).attr('r', radius)
    .call(drag);
