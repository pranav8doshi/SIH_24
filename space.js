import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

// Initialize scene, camera, and renderer
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

// Earth Group Setup
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);
const detail = 12;
const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, detail);
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./textures/00_earthmap1k.jpg"),
  specularMap: loader.load("./textures/02_earthspec1k.jpg"),
  bumpMap: loader.load("./textures/01_earthbump1k.jpg"),
  bumpScale: 0.04,
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/03_earthlights1k.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/04_earthcloudmap.jpg"),
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  alphaMap: loader.load('./textures/05_earthcloudmaptrans.jpg'),
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

// Asteroid Setup
const asteroids = [];
const numAsteroids = 20;
const radius = 2.5; // 5 cm in meters

for (let i = 0; i < numAsteroids; i++) {
    const ast_gem = new THREE.IcosahedronGeometry(0.085, 1);
    const ast_mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const ast = new THREE.Mesh(ast_gem, ast_mat);

    ast.position.x = Math.random() * 2 - 1; // Random position between -1 and 1
    ast.position.y = Math.random() * 2 - 1; // Random position between -1 and 1
    ast.position.z = Math.random() * 2 - 1; // Random position between -1 and 1
    ast.position.normalize().multiplyScalar(radius);

    scene.add(ast);

    asteroids.push({
        mesh: ast,
        angle: Math.random() * Math.PI * 2,
        latitude: 0,
        longitude: 0
    });
}

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

function animate() {
    // Update Earth's rotation
    earthMesh.rotation.y += 0.002;
    lightsMesh.rotation.y += 0.002;
    cloudsMesh.rotation.y += 0.0023;
    glowMesh.rotation.y += 0.002;
    stars.rotation.y -= 0.0002;

    // Update the position and spherical coordinates of each asteroid
    asteroids.forEach( (asteroid ,idx) => {
        asteroid.name = `Asteroid ${idx+1}`;
        asteroid.angle += 0.0025; // Speed of revolution
        asteroid.mesh.position.x = radius * Math.cos(asteroid.angle);
        asteroid.mesh.position.y = radius * Math.sin(asteroid.angle);

        const altitude = asteroid.mesh.position.length();
        const latitude = THREE.MathUtils.radToDeg(Math.asin(asteroid.mesh.position.y / altitude));
        const longitude = THREE.MathUtils.radToDeg(Math.atan2(asteroid.mesh.position.x, asteroid.mesh.position.z));

        asteroid.latitude = latitude;
        asteroid.longitude = longitude;
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
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(asteroids.map(asteroid => asteroid.mesh));

    if (intersects.length > 0) {
        const intersectedAsteroid = intersects[0].object;
        const asteroidData = asteroids.find(asteroid => asteroid.mesh === intersectedAsteroid);
    
        tooltip.innerHTML = `Name: ${asteroidData.name} <br>Latitude: ${asteroidData.latitude.toFixed(2)}<br>Longitude: ${asteroidData.longitude.toFixed(2)}`;
        tooltip.style.left = `${event.clientX + 5}px`;
        tooltip.style.top = `${event.clientY + 5}px`;
        tooltip.style.display = 'block';

    } else {
        tooltip.style.display = 'none';
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
