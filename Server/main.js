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

var locationName = 'ottawa';
var scheduleName = "";
var enabledBusRoutes = [];

function readScheduleFile() {
    var path = __dirname + '\\' + locationName + '\\schedules.json';
    var data = fs.readFileSync(path);
    var retVal = JSON.parse(data);
    return retVal;
}

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

    s.emit('onBusStopReturned', retVal);
}

function returnOnGetBusNubers(s, data) {
    var d = [1,2,3,4,5,6];
    s.emit('onBusRoutesReturned', d);
}

function setActiveBusses(s, data) {
    enabledBusRoutes = data;
    console.log(enabledBusRoutes);
}

function returnGetLocations(s, data) {
    var retVal = ['ottawa', 'toronto'];
    s.emit('onLocationsReturned', retVal);
}

function returnSetLocation(s, data) {

    locationName = data;
    s.emit('ack', {valid: 1});
}

function returnGetSchedules(s, data) {
    var retVal = ['Weekend', 'Weekday'];
    s.emit('onScheduleReturned', retVal);
}

function returnSetSchedules(s, data) {
    scheduleName = data;
    s.emit('ack', {valid: 1});
}


io.sockets.on('connection', function(socket) {
    socket.on('getLocations', function(data) { returnGetLocations(socket, data); });
    socket.on('setLocation', function(data) { returnSetLocation(socket, data); });
    socket.on('getSchedules', function(data) { returnGetSchedules(socket, data); });
    socket.on('setSchedule', function(data) { returnSetSchedules(socket, data); });
    socket.on('getBusRoutes', function(data) { returnOnGetBusNubers(socket, data); });
    socket.on('setBusRoutes', function(data) { setActiveBusses(socket, data); });
    socket.on('getBusStops', function(data) { returnOnBusStopsReceived(socket, data); });
});
