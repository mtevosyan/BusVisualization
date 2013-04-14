BusStopManager = (function() {

    var self = {};

    console.log("---- START -----");

    var DEFAULT_LOCATION = 'ottawa';
    var DEFAULT_SCHEDULE = 'Weekday';
    var BUFFER_SIZE = 100;
    var MIN_STOP_TIME_DIFF = 25;

    var buffer = {};

    var currentStartTime = 0;
    var currentStopTime = BUFFER_SIZE;
    var locations = {};
    var schedules = {};
    var busRoutes = {};
    var socket;

    var reset = function() {
        console.log("---- RESET -----");
        buffer = null;
        buffer = {};
        schedules = null;
        schedules = {};
        busRoutes = null;
        busRoutes = {};
        currentStartTime = 0;
        currentStopTime = BUFFER_SIZE;
    };

    var setLocation = function(location) {
        reset();
        socket.emit('setLocation', location);
    };

    var setSchedule = function(schedule) {
        reset();
        socket.emit('setSchedule', schedule);
    };

    var onBusRoutesReturned = function(aBusRoutes) {
        busRoutes = aBusRoutes;
        // socket.emit('setBusRoutes', busRoutes);
        // socket.emit('getBusStops', { start: 0, end: BUFFER_SIZE});
    };

    var onBusStopsReturned = function(data) {
        console.log("---- onBusStopsReturned ------");
        return;
        for (var i=0; i<data.length; i++) {
            buffer[data[i].time] = {
                routeNumber: data[i].routeNumber,
                busId: data[i].busId,
                x: data[i].x,
                y: data[i].y,
                arrivalTime: data[i].arrivalTime
            };
        }
    };

    self.init = function() {
        console.log("---- SELF -----");
        socket = io.connect('http://127.0.0.1:3000');
        socket.on('onBusRoutesReturned', onBusRoutesReturned);
        socket.on('onBusStopsReturned', onBusStopsReturned);
        setLocation(DEFAULT_LOCATION);
        setSchedule(DEFAULT_SCHEDULE);
        // socket.emit('getBusRoutes');
    };

    self.reset = reset;
    self.setLocation = setLocation;
    self.setSchedule = setSchedule;

    // --- Interface ---

    self.getLocations = function(callback) {
        socket.on('onLocationsReturned', callback);
        socket.emit('getLocations', {});
    };

    self.getSchedules = function(callback) {
        socket.on('onScheduleReturned', callback);
        socket.emit('getSchedules', {});
    };

    self.getBusRoutes = function(callback) {
        socket.on('onBusRoutesReturned', callback);
        socket.emit('getBusRoutes', {});
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

    return self;
})();