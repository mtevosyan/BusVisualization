var port = process.env.PORT || 3000;
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

app.listen(port);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function returnOnBusStopsReceived(s, data) {
    var data1 = [{hello: "World"},
                {hello: "World"}];
    
    s.emit('onBusStopsReceived', data1);
}

function returnOnGetBusNubers(s, data) {
    var d = [1,2,3,4,5,6];
    s.emit('onBusNumbersReceived', d);
}

function setActiveBusses(s, data) {
    console.log('Set Active Bus');
    console.log(data);
}

io.sockets.on('connection', function(socket) {
    socket.on('getBusNumbers', function(data) { returnOnGetBusNubers(socket, data); });
    socket.on('setActiveBusses', function(data) { setActiveBusses(socket, data); });
    socket.on('getBusStops', function(data) { returnOnBusStopsReceived(socket, data); });
});
