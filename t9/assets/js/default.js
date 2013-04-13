var x = 20;
var y = 20;
	
$(document).ready(function() {
	google.maps.event.addDomListener(window, 'load', initialize);
	
	function initialize() {
		// init map
		var mapOptions = {
			center: new google.maps.LatLng(45.403151,-75.70919),
			zoom: 13,
			disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	}
	
	$("#glcanvas").click(function(e){

    x = (Math.floor(e.pageX-$("#glcanvas").offset().left)-$("#glcanvas").width()/2)/20;
    y = -(Math.floor(e.pageY-$("#glcanvas").offset().top)-$("#glcanvas").height()/2)/10;


 });
	
	webGLStart();
});