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

    var onLocationsReturned = function(aLocations) {
        console.log(aLocations);
        locations = aLocations;
    };

    self.init = function() {
        console.log("---- SELF -----");
        socket = io.connect('http://127.0.0.1:3000');
        socket.on('onSchedulesReturned', self.onSchedulesReturned);
        socket.on('onBusNumbersReturned', self.onBusRoutesReturned);
        socket.on('onBusStopsReturned', self.onBusStopsReturned);
        setLocation(DEFAULT_LOCATION);
        setSchedule(DEFAULT_SCHEDULE);
        // socket.emit('getBusRoutes');
    };

    self.reset = reset;
    self.setLocation = setLocation;
    self.setSchedule = setSchedule;
    self.onLocationsReturned = onLocationsReturned;

    // --- Interface ---

    self.getLocations = function(callback) {
        socket.on('onLocationsReturned', callback);
        socket.emit('getLocations', {});
    };

    self.getSchedules = function(callback) {
        socket.on('onScheduleReturned', callback);
        socket.emit('getSchedules', {});
    };

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

    // self.onLocationsReturned = function(aLocations) {
    //     console.log(aLocations);
    //     locations = aLocations;
    // };

    self.onSchedulesReturned = function(aSchedules) {
        console.log(aSchedules);
        schedules = aSchedules;
    };

    self.onBusRoutesReturned = function(aBusRoutes) {
        console.log(aBusRoutes);
        busRoutes = aBusRoutes;
        // socket.emit('setBusRoutes', busRoutes);
        // socket.emit('getBusStops', { start: 0, end: BUFFER_SIZE});
    };

    self.onBusStopsReturned = function(data) {
        console.log("---- onBusStopsReturned ------");
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

    return self;
})();