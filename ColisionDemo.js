import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Raycaster and mouse for detecting hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.padding = '5px';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.borderRadius = '5px';
tooltip.style.pointerEvents = 'none';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Create an array to store multiple asteroids
const asteroids = [];
const numAsteroids = 2;
const radius = 2.5; // 5 cm in meters
const positions = [[-1200,250,0], [1200,250,0]]
// Create asteroids and position them randomly
for (let i = 0; i < numAsteroids; i++) {
    const ast_gem = new THREE.IcosahedronGeometry(0.5, 1);
    const ast_mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const ast = new THREE.Mesh(ast_gem, ast_mat);

    // Assign a random initial position within a specified range
    // ast.position.x = Math.random() * 2 - 1; // Random position between -1 and 1
    // ast.position.y = Math.random() * 2 - 1; // Random position between -1 and 1
    // ast.position.z = Math.random() * 2 - 1; // Random position between -1 and 1

    ast.position.x = positions[i][0];
    ast.position.y = positions[i][1];
    ast.position.z = positions[i][2];

    // Normalize the position and multiply by the desired radius
    ast.position.normalize().multiplyScalar(radius);

    scene.add(ast);

    asteroids.push({
        name:`Space Debris ${i+1}`,
        mesh: ast,
        angle: Math.random() * Math.PI * 2,
        latitude: 0,
        longitude: 0
    });
}

camera.position.z = 5;

function animate() {
    // Update the position and spherical coordinates of each asteroid
    asteroids.forEach( (asteroid) => {
        // asteroid.angle += 0.005; // Speed of revolution
        // asteroid.mesh.position.x = radius * Math.cos(asteroid.angle);
        // asteroid.mesh.position.y = radius * Math.sin(asteroid.angle);
        // asteroid.mesh.position.z = radius * Math.sin(asteroid.angle * 0.5); // Optional: add some z-axis movement
        
        let x = asteroid.mesh.position.x;

        if(x < 0)
        {
            asteroid.mesh.position.x = x + 0.025;
            console.log(asteroid.mesh.position.x)
        }
        else if(x > 0 && asteroid.mesh.position.x != 0.7974510493440173) 
            asteroid.mesh.position.x = x - 0.025;
        
        // asteroid.mesh.position.x++;
        // Calculate spherical coordinates dynamically
        const altitude = asteroid.mesh.position.length(); // Distance from origin
        const latitude = THREE.MathUtils.radToDeg(Math.asin(asteroid.mesh.position.y / altitude)); // Y-axis angle
        const longitude = THREE.MathUtils.radToDeg(Math.atan2(asteroid.mesh.position.x, asteroid.mesh.position.z)); // XZ-plane angle

        asteroid.latitude = latitude;
        asteroid.longitude = longitude;
        // asteroid.altitude = altitude;
    });

    renderer.render(scene, camera);
}


renderer.setAnimationLoop(animate);

// Event listener for mouse movement
document.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the current mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(asteroids.map(asteroid => asteroid.mesh));

    if (intersects.length > 0) {
        const intersectedAsteroid = intersects[0].object;
        const asteroidData = asteroids.find(asteroid => asteroid.mesh === intersectedAsteroid);

        // Display the tooltip with updated information
        tooltip.innerHTML = `Name: ${asteroidData.name} <br>Latitude: ${asteroidData.latitude.toFixed(2)}<br>Longitude: ${asteroidData.longitude.toFixed(2)}`;
        tooltip.style.left = `${event.clientX + 5}px`;
        tooltip.style.top = `${event.clientY + 5}px`;
        tooltip.style.display = 'block';
    } else {
        // Hide the tooltip if no intersection
        tooltip.style.display = 'none';
    }
}

// Handle window resize
// window.addEventListener('resize', () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });
