BusStopManager = (function() {

    var self = {};

    var DEFAULT_LOCATION = 'ottawa';
    var DEFAULT_SCHEDULE = 'SEPT12-SEPDA12-Weekday-09';
    var BUFFER_SIZE = 100;
    var MIN_STOP_TIME_DIFF = 25;

    var buffer = {};

    var currentStartTime = 0;
    var currentStopTime = BUFFER_SIZE;
    var locations = {};
    var schedules = {};
    var busRoutes = {};
    var busRoutesCallback = null;
    var socket;

    var reset = function() {
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
        if (busRoutesCallback) {
            busRoutesCallback(aBusRoutes);
        }
        busRoutes = aBusRoutes;
        socket.emit('setBusRoutes', busRoutes);
        socket.emit('getBusStops', { start: 1000, end: 1100});
    };

    var onBusStopsReturned = function(busStops) {
        console.log("---- onBusStopsReturned ----");
        for (var i=0; i<busStops.length; i++) {
            var busStop = busStops[i];
            if (!buffer[busStop.t]) {
                buffer[busStop.t] = [];
            }
            buffer[busStop.t].push(busStop);
        }
        console.log(buffer);
    };

    self.init = function() {
        socket = io.connect('http://127.0.0.1:3000');
        socket.on('onBusRoutesReturned', onBusRoutesReturned);
        socket.on('onBusStopReturned', onBusStopsReturned);
        setLocation(DEFAULT_LOCATION);
        setSchedule(DEFAULT_SCHEDULE);
        socket.emit('getBusRoutes');
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
        busRoutesCallback = callback;
        socket.emit('getBusRoutes', {});
    };

    self.getGpsCenter = function(callback) {
        socket.on('onGPSCenterReturned', callback);
        socket.emit('getGPSCenter', {});
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