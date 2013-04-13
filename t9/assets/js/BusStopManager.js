function BusStopManager() {

    var BUFFER_SIZE = 10;

    this.busNumbers = {};
    this.busStops = {};

    var socket = io.connect('http://localhost');

    this.getBusNumbers = function() {
        return this.busNumbers;
    };

    this.getNextBusStop = function(busNumber) {
        if (bustStops[busNumber]) {
            return busStops[busNumber].dequeue();
        }
    };

    this.onNewBusStopFetched = function(busStop) {
        if (!busStops[busStop.busNumber]) {
            busStops[busStop.busNumber] = new Queue();
        }
        if (busStops[bustStop.busNumber].getLength() < BUFFER_SIZE) {
            busStops[busStop.busNumber].enqueue(busStop);
        }
    };

}