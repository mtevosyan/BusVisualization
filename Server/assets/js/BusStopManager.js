BusStopManager = (function() {
try{
    var BUFFER_SIZE = 100;
    var MIN_STOP_TIME_DIFF = 25;

    var buffer = {};

    var currentTimeRequest = 0;
    var lastStopTime = BUFFER_SIZE;
    var busNumbers = {};
    var busNumberEnabled = {};
    var socket;

    var self = function() {
        socket = io.connect('http://localhost:3000');
        socket.on('onBusNumbersReceived', self.onBusNumbersRecieved());
        socket.on('onBusStopsReceived', self.onBusStopsReceived());
        socket.emit('getBusNumbers');
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
        currentTimeRequest = time;
        if (lastStopTime - time < MIN_STOP_TIME_DIFF) {
            socket.emit('getBusStops', { start: lastStopTime, end: lastStopTime + BUFFER_SIZE});
            lastStopTime = lastStopTime + BUFFER_SIZE;
        }
        return buffer[time];
    };

    // --- Server callbacks ---

    self.onBusNumbersReceived = function(aBusNumbers) {
        console.log(aBusNumbers);
        // busNumbers = aBusNumbers;
        // socket.emit('getBusStops', { start: 0, end: BUFFER_SIZE});
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
    return self;
}catch(err)
{
    console.log(err);
}
})();