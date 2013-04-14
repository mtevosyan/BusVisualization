var map;
	
$(document).ready(function() {
	google.maps.event.addDomListener(window, 'load', initialize);
	
	function initialize() {
		// init map
		var mapOptions = {
			center: new google.maps.LatLng(45.403151,-75.70919),
			zoom: 16,
			disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	}
	
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;
	var FLOOR = -250;

	var container;

	var camera, scene;
	var canvasRenderer, webglRenderer;

	var mesh, zmesh, geometry;
	var mouseX = 0, mouseY = 0;

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
		camera.position.z = 140;
		
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
		
		var loader = new THREE.JSONLoader(),
			callbackObj = function( geometry ) { createScene( geometry, 0, 0, 0, 0 ) };
		loader.load( "./assets/bus.js", callbackObj );
	}

	function createScene( geometry, x, y, z, b ) {
		zmesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial() );
		zmesh.position.set( x, y, z );
		zmesh.scale.set( 1, 1, 1 );
		zmesh.overdraw = true;
		zmesh.rotation.x += 6.7;
		zmesh.rotation.y += 8.1;
		scene.add( zmesh );
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
		zmesh.scale.set( 1/(16-vl+1), 1/(16-vl+1), 1/(16-vl+1) );
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
});