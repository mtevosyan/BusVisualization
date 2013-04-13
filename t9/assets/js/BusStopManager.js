var BusStopManager = (function() {

    var BUFFER_SIZE = 10;
    var INITIAL_STOP_TIME = 100;

    var buffer = {};

    var currentStart = 0;
    var currentStop = INITIAL_STOP_TIME;
    var busNumbers = {};
    var busNumberEnabled = {};
    var busStops = {};
    var socket;

    var self = function() {
        socket = io.connect('http://localhost');
        socket.on('onBusNumbersReceived', self.onBusNumbersRecieved());
        socket.on('onBusStopsReceived', self.onBusStopsReceived());
    };

    // --- Interface ---

    self.getBusNumbers = function() {
        return busNumbers;
    };

    self.enableBusNumber = function(busNumber, enable) {
        if (enable) {
            busNumbers.insert(busNumber);
        } else {
            delete busNumbers[busNumbers];
        }
    };

    self.getBusStops = function(time) {
        if (bustStops[busNumber]) {
            return busStops[busNumber].dequeue();
        }
    };

    // --- Server callbacks ---

    self.onBusNumbersReceived = function(aBusNumbers) {
        busNumbers = aBusNumbers;
        socket.emit('getBusStops', { start: currentStart, end: currentStop });
    };

    self.onBusStopsReceived = function(data) {
        for (var i=0; i<data.length; i++) {
            buffer[data[i].time] = {
                routeNumber: data[i].routeNumber,
                busNumber: data[i].busNumber,
                x: data[i].x,
                y: data[i].y,
                nextTime: data[i].nextTime
            };
        }
    };

})();