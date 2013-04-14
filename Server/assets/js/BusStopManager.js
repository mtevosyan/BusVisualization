BusStopManager = (function() {

    var BUFFER_SIZE = 100;
    var MIN_STOP_TIME_DIFF = 25;

    var buffer = {};

    var currentStartTime = 0;
    var currentStopTime = BUFFER_SIZE;
    var busRoutes = {};
    var socket;

    var self = function() {
        socket = io.connect('http://localhost:3000');
        socket.on('onBusNumbersReceived', self.onBusRoutesRecieved());
        socket.on('onBusStopsReceived', self.onBusStopsReceived());
        socket.emit('getBusRoutes');
    };

    // --- Interface ---

    self.getBusRoutes = function() {
        return busRoutes;
    };

    self.enableRouteNumber = function(routeNumber, enable) {
        if (enable) {
            busRoutes.insert(routeNumber);
        } else {
            delete busRoutes[routeNumber];
        }
        socket.emit('setBusRoutes', busRoutes);
    };

    self.getBusStops = function(time) {
        if (currentStopTime - time < MIN_STOP_TIME_DIFF) {
            // delete old data
            for (var i=currentStartTime; i<time; i++) {
                delete buffer[i];
            }
            currentStartTime = time;
            // request new data ahead
            socket.emit('getBusStops', { start: currentStopTime, end: currentStopTime + BUFFER_SIZE});
            currentStopTime += BUFFER_SIZE;
        }
        return buffer[time];
    };

    // --- Server callbacks ---

    self.onBusRoutesReceived = function(aBusRoutes) {
        console.log(aBusRoutes);
        busRoutes = aBusRoutes;
        socket.emit('setBusRoutes', busRoutes);
        socket.emit('getBusStops', { start: 0, end: BUFFER_SIZE});
    };

    self.onBusStopsReceived = function(data) {
        for (var i=0; i<data.length; i++) {
            buffer[data[i].time] = {
                routeNumber: data[i].routeNumber,
                busId: data[i].busId,
                x: data[i].x,
                y: data[i].y,
                nextTime: data[i].nextTime
            };
        }
    };
    return self;
})();