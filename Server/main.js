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
var scheduleData = null;
var scheduleName = "";
var routesData =  {};
var enabledBusRoutes = {};
var indexData = [];

function readScheduleFile() {
    var path = __dirname + '/dataset/' + locationName + '/schedules.json';
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

function readIndex() {
    var path = __dirname + '/dataset/' + locationName + '/' + scheduleData[scheduleName].index;
    var data = fs.readFileSync(path);
    indexData = JSON.parse(data);
    return indexData;
}

function readStopBlockData(from, to) {
    var fromByte = indexData[from];
    var toByte = indexData[to] - 3;
    var path = __dirname + '/dataset/' + locationName + '/' + scheduleData[scheduleName].data;
    var fd = fs.openSync(path, 'r');
    var data = new Buffer(toByte - fromByte);
    var byteRead = fs.readSync(fd, data, 0, toByte - fromByte, fromByte);
    fs.closeSync(fd);
    console.log(data.toString());
    var retVal = JSON.parse(data);
    return retVal;
}

function returnOnBusStopsReceived(s, data) {
    for(t = data.start; t < data.end + 1; ++t)
    {
        var rawData = readStopBlockData(t, t+1);
        var retVal = []
        rawData.forEach(function(a) {
            if(enabledBusRoutes[a.r]) {
                a.t = t;
                retVal.push(a);
            }
        });
        s.emit('onBusStopReturned', retVal);
    }
}

function readBusRoutes() {
    var path = __dirname + '/dataset/' + locationName + '/routes.json';
    var data = fs.readFileSync(path);
    var retVal = JSON.parse(data);
    return retVal;

};

function returnOnGetBusNubers(s, data) {
    var retVal = [];
    var routes = readBusRoutes()
    routes.forEach(function(a) {
        retVal.push(a.r);
        routesData[a.r] = a;
    });
    s.emit('onBusRoutesReturned', retVal);
}

function setActiveBusses(s, data) {
    enabledBusRoutes = {};
    var error = false;
    data.forEach(function(a) {
        if(routesData[a]) {
            enabledBusRoutes[a] = 1;
        } else {
            error = true;
        }
    });

    if (!error) {
        s.emit('ack', {valid: true});
        readIndex();
    } else {
        s.emit('ack', {valid: false});
    }
}

function returnGetLocations(s, data) {
    var retVal = ['ottawa', 'toronto'];
    s.emit('onLocationsReturned', retVal);
}

function returnSetLocation(s, data) {
    locationName = data;
    s.emit('ack', {valid: 1});
}

function processSchedulesData() {
    var schedule = readScheduleFile();
    scheduleData = {};
    schedule.forEach(function(a) {
        scheduleData[a.name] = a;
    });

    return schedule;
}

function returnGetSchedules(s, data) {
    var schedule = processSchedulesData();
    var retVal = [];
    schedule.forEach(function(a) {
        retVal.push(a.name);
    });
    s.emit('onScheduleReturned', retVal);
}

function returnSetSchedules(s, data) {
    if (!scheduleData) {
        processSchedulesData();
    }

    scheduleName = data;
    if(scheduleData[scheduleName]) {
        s.emit('ack', {valid: true});
    } else {
        s.emit('ack', {valid: false});
    };

}

function returnGetGPSCenter(s, data) {
    var retVal = {gps_lat: scheduleData[scheduleName].gps_lat,
                  gps_long: scheduleData[scheduleName].gps_long};

    s.emit('onGPSCenterReturned', retVal);
}

io.sockets.on('connection', function(socket) {
    socket.on('getLocations', function(data) { returnGetLocations(socket, data); });
    socket.on('setLocation', function(data) { returnSetLocation(socket, data); });
    socket.on('getSchedules', function(data) { returnGetSchedules(socket, data); });
    socket.on('setSchedule', function(data) { returnSetSchedules(socket, data); });
    socket.on('getGPSCenter', function(data) { returnGetGPSCenter(socket, data); });
    socket.on('getBusRoutes', function(data) { returnOnGetBusNubers(socket, data); });
    socket.on('setBusRoutes', function(data) { setActiveBusses(socket, data); });
    socket.on('getBusStops', function(data) { returnOnBusStopsReceived(socket, data); });
});
