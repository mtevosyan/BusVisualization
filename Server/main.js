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
  if(req.url == '/') {
      req.url = '/index.html';
  }
  console.log(req.url);
  fs.readFile(__dirname + req.url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var enabledBusRoutes = [];

function generateBusData(routeNbr, busNbr, t, nT, X, Y)
{
    var retVal = {routeNumber: routeNbr,
                  busNumber: busNbr,
                  time: t,
                  nextTime: nT,
                  x: X,
                  y: Y};

    return retVal;
}


function returnOnBusStopsReceived(s, data) {
    var retVal = [];

    for(time = data.start; time < data.end; ++time) {
        for(index = 0; index < enabledBusRoutes.length; ++index) {
            var route = enabledBusRoutes[index];
            retVal.push(generateBusData(route, route, time, time+1, 12, 24));
        }
    }

    s.emit('onBusStopsReceived', retVal);
}

function returnOnGetBusNubers(s, data) {
    var d = [1,2,3,4,5,6];
    s.emit('onBusNumbersReceived', d);
}

function setActiveBusses(s, data) {
    enabledBusRoutes = data;
    console.log(enabledBusRoutes);
}

io.sockets.on('connection', function(socket) {
    socket.on('getBusNumbers', function(data) { returnOnGetBusNubers(socket, data); });
    socket.on('setActiveBusses', function(data) { setActiveBusses(socket, data); });
    socket.on('getBusStops', function(data) { returnOnBusStopsReceived(socket, data); });
});
