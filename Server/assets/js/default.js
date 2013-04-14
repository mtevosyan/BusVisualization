var map;
var manager;
var buses;
var points = [0,1,2,3,4,5,6,7,8,9];

var BUS_REQUEST_INTERVAL = 20;
var MAX_TIME = 1300;
var currentTime = 0;

$(document).ready(function() {
	google.maps.event.addDomListener(window, 'load', initialize);
	
	buses = new Array();
	
	var loader = new THREE.JSONLoader(),
	callbackObj = function( geometry ) { createScene( geometry, 0, 0, 0, 0 ) };
	loader.load( "./assets/bus.js", callbackObj );
	
	var onGetBusStops = function(busStops) {
		console.log('busStops');
	}
	
	var onGetSchedules = function(schedules) {
		for (var i = 0; i < 10; i ++) {
			var bm = getBusMesh(i);
			if (bm) {
				scene.add(bm);
			}
		}
	}
	
	function change_position() {
    try
    {
		if (points.length != 0) {
			points.pop();
			
            for (var i=0;i<10;i++)
            {
                var bm = getBusMesh(i);
                if (bm)
                {
                    bm.position.x -= 10;
                    bm.position.y -= 10;
                }
            }
		}
        }catch(err){
            console.error(err);
        }
	}
  
	BusStopManager.init();
	// BusStopManager.getSchedules(onGetSchedules);
    var timer = setInterval(requestBusStops, BUS_REQUEST_INTERVAL);
    var busInScene = {};

    function requestBusStops() {
        var busStops = BusStopManager.getBusStops(currentTime);
        if (busStops) {
	        for (var i=0; i<busStops.length; i++) {
	            var busStop = busStops[i];
	            var bus = getBusMesh(busStop.b);
	            if (bus) {
	            	bus.position.x = busStop.x / 50;
	            	bus.position.y = busStop.y / 50;
	            	if (!busInScene[busStop.b]) { 
	            		scene.add(bus);
	            		busInScene[busStop.b] = true;
	            	}
	            }
	        }
	    }
        currentTime = (currentTime + 1) % MAX_TIME;
    }
	
	function initialize() {
		// init map
		var mapOptions = {
			center: new google.maps.LatLng(45.403151,-75.70919),
			zoom: 12,
			disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
	}
	
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var FLOOR = -250;

	var container;

	var camera, scene;
	var canvasRenderer, webglRenderer;

	var mesh, zmesh, geometry;
	var mouseX = 0, mouseY = 0;
    
    var bus_meshes = {};
    function getBusMesh(id)
    {
        var result = bus_meshes[id];
        if (!result && geometry)
        {
            result = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial() );
            bus_meshes[id] = result;
            result.position.set( Math.random()*100-50, Math.random()*100-50, 0);
            result.scale.set( 1, 1, 1 );
            result.overdraw = true;
            result.rotation.x += 6.7;
            result.rotation.y += 8.1;
        }
        return result;
    }

	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

	var render_canvas = 1, render_gl = 1;
	var has_gl = 0;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	init();
	animate();

	function init() {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
		
		camera = new THREE.PerspectiveCamera( 75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 100000 );
		camera.position.z = 600;
		
		scene = new THREE.Scene();
		// LIGHTS
		var ambient = new THREE.AmbientLight( 0xffffff );
		scene.add( ambient );
		
		// RENDERER
		try {
			webglRenderer = new THREE.WebGLRenderer({
				antialias: true
			});
			webglRenderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
			webglRenderer.domElement.style.position = "absolute";
			webglRenderer.domElement.style.top = "0";
			
			container.appendChild( webglRenderer.domElement );
			
			has_gl = 1;
		}
		catch (e) {
		}
		
		/*var loader = new THREE.JSONLoader(),
			callbackObj = function( geometry ) { createScene( geometry, 0, 0, 0, 0 ) };
		loader.load( "/assets/bus.js", callbackObj );*/
	}

	function createScene( _geometry, x, y, z, b ) {
    geometry = _geometry;
		zmesh = new THREE.Mesh( _geometry, new THREE.MeshFaceMaterial() );
		zmesh.position.set( x, y, z );
		zmesh.scale.set( 1, 1, 1 );
		zmesh.overdraw = true;
		zmesh.rotation.x += 6.7;
		zmesh.rotation.y += 8.1;
		//scene.add( zmesh );
	}
	
	function onDocumentMouseMove(event) {
		mouseX = ( event.clientX - windowHalfX );
		mouseY = ( event.clientY - windowHalfY );
	}

	function animate() {
		requestAnimationFrame( animate );
		render();
	}
	
	var t = 0.0;
	
	function render() {
		t += .01;
		//camera.position.x += ( mouseX/3 - camera.position.x ) * .1;
		//camera.position.y += ( - mouseY/2 - camera.position.y ) * .1;
		camera.lookAt( scene.position );
		if ( render_gl && has_gl ) {
			webglRenderer.render( scene, camera );
		}
	}
	
	$("#slide").bind('change', function() {
		//console.log($(this).val());
	});
	
	$("#slider_zoom").bind('change', function() {
		var diff = map.getZoom();
		var vl = parseFloat($(this).val());
		
		map.setZoom(vl);
		
		$.each(buses, function(index, bus) {
			bus.scale.set(1/(16-vl+1), 1/(16-vl+1), 1/(16-vl+1));
		});
	});
	
	$("#options_gear").bind('click', function() {
		if ($("#optionsbar").css('right') == '-300px') {
			
			$("#options_gear").animate({
				'margin-right': '324'
			}, 1000);
			
			$('#optionsbar').css('display', 'block');
			$('#optionsbar').animate({
				'right': '-1'
			}, 1000, function() {
			});
			
		} else {
			$("#options_gear").animate({
				'margin-right': '24'
			}, 1000);
			
			$('#optionsbar').animate({
				'right': '-300'
			}, 1000, function() {
				$('#optionsbar').css('display', 'none');
			});
		}
	});
    
    // setInterval(change_position, 1000);
});