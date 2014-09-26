var app = require('express')();
var server = require('http').Server(app);
var serveStatic = require('serve-static');

var port = 3000;

app.use(serveStatic('public'));

server.listen(port, function(){
  console.log('listening on port ' + port);
});
