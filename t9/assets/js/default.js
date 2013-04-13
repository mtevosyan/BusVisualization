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
	
	var camera, scene, renderer;
    var geometry, material, mesh;

    init();
    animate();

    function init() {
		var obj = document.getElementById("glcanvas");
		
		renderer = new THREE.CanvasRenderer();
        renderer.setSize($("#glcanvas").width(), $("#glcanvas").height() );
		
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = 1000;
		
        scene = new THREE.Scene();
		
		var materialArray = [];
		materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/assets/img/0.png' ) }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/assets/img/2.png' ) }));
		materialArray.push(new THREE.MeshBasicMaterial( { color: 0x0e143e }));
		materialArray.push(new THREE.MeshBasicMaterial( { transparent: true, opacity: 0.3 }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/assets/img/3.png' ) }));
		materialArray.push(new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( '/assets/img/1.png' ) }));//color: 0x0e143e
		var material = new THREE.MeshFaceMaterial(materialArray);
		
		var cubeGeo = new THREE.CubeGeometry(100,40,40, 3, 3, 3);
		mesh = new THREE.Mesh(cubeGeo, material);

		mesh.position.set(30, 30, 0 );
        scene.add( mesh );
		
        mesh.rotation.x -= 19;
		mesh.rotation.y = -7;
		
        obj.appendChild( renderer.domElement );
    }

    function animate() {
        requestAnimationFrame( animate );
		
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
		//console.log(mesh.rotation.y);
        renderer.render( scene, camera );
    }
	
	
	$("#slide").bind('change', function() {
		console.log($(this).val());
	});
	
});