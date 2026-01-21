import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG, getWorldHeight } from './utils.js';
import { createTerrain } from './terrain.js';
import { createWater, updateWater } from './water.js';
import { setupCities, createCities, getCities, getChimneys, updateCityLights } from './cities.js';
import { setupSky, createClouds, updateSky } from './sky.js';
import { createVegetation } from './vegetation.js';
import { setupParticles, updateParticles, spawnSmoke } from './particles.js';

const state = {
    seeds: { x: Math.random() * 5000, z: Math.random() * 5000 },
    stormSeeds: { x: Math.random() * 5000 + 10000, z: Math.random() * 5000 + 10000 }
};

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 100, 450);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 90);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; 
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05; 
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 20; controls.maxDistance = 250; controls.zoomSpeed = 0.3;

// --- CRIAÇÃO DO SLIDER DE TEMPO ---
const sliderContainer = document.createElement('div');
sliderContainer.style.position = 'absolute';
sliderContainer.style.bottom = '20px';
sliderContainer.style.right = '20px';
sliderContainer.style.background = 'rgba(0,0,0,0.7)';
sliderContainer.style.padding = '10px';
sliderContainer.style.borderRadius = '8px';
sliderContainer.style.color = 'white';
sliderContainer.innerHTML = `
    <label style="font-family: sans-serif; font-size: 14px;">⏳ Hora do Dia</label><br>
    <input type="range" id="timeSlider" min="0" max="2400" value="1200" style="width: 200px; cursor: pointer;">
`;
document.body.appendChild(sliderContainer);

const timeSlider = document.getElementById('timeSlider');
let manualTime = 12 * 60; // Começa meio-dia (minutos)
let isDraggingSlider = false;

timeSlider.addEventListener('input', (e) => {
    isDraggingSlider = true;
    manualTime = parseInt(e.target.value); // Valor em minutos (0 a 2400)
});
timeSlider.addEventListener('change', () => {
    isDraggingSlider = false; // Soltou o slider, o tempo volta a correr
});
// -----------------------------------

const clock = new THREE.Clock();

setupSky(scene);
setupCities(scene);
setupParticles(scene); 

function generateWorld(loadedData = null) {
    createTerrain(scene, state.seeds);
    createWater(scene);
    createCities(state.seeds, loadedData ? loadedData.cities : null);
    createVegetation(scene, state.seeds);
    createClouds(); 
    console.log("Mundo gerado!");
}

generateWorld();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
let draggingCity = null; 
const infoDiv = document.getElementById('info');

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

function onPointerDown(event) {
    if (event.target.closest('button') || event.target.closest('input')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getCities());
    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        draggingCity = hitMesh.parent; 
        controls.enabled = false;
        const data = hitMesh.userData;
        document.getElementById('cityName').innerText = data.name;
        document.getElementById('cityPop').innerText = data.pop;
        document.getElementById('cityType').innerText = data.type;
        infoDiv.style.display = 'block';
    } else { infoDiv.style.display = 'none'; }
}

function onPointerMove(event) {
    if (!draggingCity) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, target);
    if (target) {
        const newX = target.x;
        const newZ = target.z;
        const newY = getWorldHeight(newX, newZ, state.seeds);
        draggingCity.position.set(newX, newY, newZ);
    }
}

function onPointerUp() { draggingCity = null; controls.enabled = true; }

function saveGame() {
    const uniqueCities = new Set();
    const citiesData = [];
    getCities().forEach(mesh => {
        const cityGroup = mesh.parent;
        if (!uniqueCities.has(cityGroup)) {
            uniqueCities.add(cityGroup);
            citiesData.push({ x: cityGroup.position.x, y: cityGroup.position.y, z: cityGroup.position.z, userData: mesh.userData });
        }
    });
    const saveData = { seeds: state.seeds, stormSeeds: state.stormSeeds, cities: citiesData };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveData));
    const a = document.createElement('a');
    a.href = dataStr; a.download = "rpg_world.json";
    a.click();
}

function loadGame(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            state.seeds = data.seeds;
            state.stormSeeds = data.stormSeeds;
            generateWorld(data);
            e.target.value = '';
        } catch (err) { alert("Erro ao carregar: " + err); }
    };
    reader.readAsText(file);
}

function newGame() {
    state.seeds = { x: Math.random() * 5000, z: Math.random() * 5000 };
    state.stormSeeds = { x: Math.random() * 5000 + 10000, z: Math.random() * 5000 + 10000 };
    generateWorld();
}

document.getElementById('btnSave').addEventListener('click', saveGame);
document.getElementById('btnLoad').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', loadGame);
document.getElementById('btnNew').addEventListener('click', newGame);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Tempo entre frames
    const totalTime = clock.getElapsedTime();

    // Se não estiver mexendo no slider, o tempo avança sozinho
    if (!isDraggingSlider) {
        manualTime += delta * 100; // Velocidade do tempo (60x)
        if (manualTime >= 2400) manualTime = 0; // Reseta dia
        timeSlider.value = manualTime; // Atualiza visual do slider
    }

    // Converte minutos (0-2400) para ciclo (0.0 a 1.0)
    // Dividimos por 2400 pq 24h * 100 (escala do slider)
    const cycleTime = (manualTime % 2400) / 2400;

    // Atualiza Sky e recebe a altura normalizada do sol
    const sunHeightNorm = updateSky(scene, cycleTime);
    updateCityLights(sunHeightNorm);
    updateWater(totalTime, state.stormSeeds);

    if (Math.floor(totalTime * 60) % 5 === 0) {
        const chimneys = getChimneys();
        chimneys.forEach(c => {
            const worldPos = c.offset.clone().applyMatrix4(c.parent.matrixWorld);
            spawnSmoke(worldPos.x, worldPos.y, worldPos.z);
        });
    }
    updateParticles();

    // UI
    const gameHour = Math.floor(cycleTime * 24);
    const gameMin = Math.floor((cycleTime * 24 * 60) % 60);
    document.getElementById('time-display').innerText = `Hora: ${gameHour.toString().padStart(2,'0')}:${gameMin.toString().padStart(2,'0')}`;

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();