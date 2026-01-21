import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG } from './utils.js';
import { createTerrain } from './terrain.js';
import { createWater, updateWater } from './water.js';
import { setupCities, createCities, getCities } from './cities.js';
import { setupSky, createClouds, updateSky } from './sky.js';
import { createVegetation } from './vegetation.js';

// --- ESTADO DO MUNDO ---
const state = {
    seeds: { x: Math.random() * 5000, z: Math.random() * 5000 },
    stormSeeds: { x: Math.random() * 5000 + 10000, z: Math.random() * 5000 + 10000 }
};

// --- SETUP THREE.JS ---
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
labelRenderer.domElement.style.pointerEvents = 'none'; // Permite clicar através do texto
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

controls.minDistance = 20;  // Impede de chegar muito perto (evita bugs visuais)
controls.maxDistance = 250; // Impede de se afastar demais do mapa
controls.zoomSpeed = 0.3;

const clock = new THREE.Clock();

// --- INICIALIZAÇÃO ---
setupSky(scene);
setupCities(scene);

function generateWorld(loadedData = null) {
    createTerrain(scene, state.seeds);
    createWater(scene);
    createCities(state.seeds, loadedData ? loadedData.cities : null);
    createVegetation(scene, state.seeds);
    createClouds(); // Nuvens sempre novas
    console.log("Mundo gerado!");
}

// Gera o primeiro mundo
generateWorld();

// --- FUNÇÕES DE SALVAR/CARREGAR ---
function saveGame() {
    const citiesData = getCities().map(c => ({
        x: c.position.x, y: c.position.y, z: c.position.z, userData: c.userData
    }));
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

// --- EVENTOS ---
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

// Raycaster (Clique nas cidades)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const infoDiv = document.getElementById('info');

window.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(getCities());
    
    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        document.getElementById('cityName').innerText = data.name;
        document.getElementById('cityPop').innerText = data.pop;
        document.getElementById('cityType').innerText = data.type;
        infoDiv.style.display = 'block';
    } else {
        infoDiv.style.display = 'none';
    }
});

// --- LOOP PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);
    const totalTime = clock.getElapsedTime();
    const cycleTime = (totalTime % CONFIG.dayDuration) / CONFIG.dayDuration;

    updateWater(totalTime, state.stormSeeds);
    updateSky(scene, cycleTime);

    // Update Relógio UI
    const gameHour = Math.floor(cycleTime * 24);
    const gameMin = Math.floor((cycleTime * 24 * 60) % 60);
    document.getElementById('time-display').innerText = `Hora: ${gameHour.toString().padStart(2,'0')}:${gameMin.toString().padStart(2,'0')}`;

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();