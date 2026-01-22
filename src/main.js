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
import { setupKingdomEditor, kingdomState } from './ui.js'; 

const state = {
    seeds: { x: Math.random() * 5000, z: Math.random() * 5000 },
    stormSeeds: { x: Math.random() * 5000 + 10000, z: Math.random() * 5000 + 10000 },
    // Nova seed específica para localização das cidades
    citySeed: Math.random() * 5000 
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

// SLIDER DE TEMPO
const sliderContainer = document.createElement('div');
sliderContainer.style.position = 'absolute'; sliderContainer.style.bottom = '20px'; sliderContainer.style.right = '20px';
sliderContainer.style.background = 'rgba(0,0,0,0.7)'; sliderContainer.style.padding = '10px'; sliderContainer.style.borderRadius = '8px'; sliderContainer.style.color = 'white';
sliderContainer.innerHTML = `<label style="font-family: sans-serif; font-size: 14px;">⏳ Hora do Dia</label><br><input type="range" id="timeSlider" min="0" max="2400" value="1200" style="width: 200px; cursor: pointer;">`;
document.body.appendChild(sliderContainer);
const timeSlider = document.getElementById('timeSlider');
let manualTime = 12 * 60; 
let isDraggingSlider = false;
timeSlider.addEventListener('input', (e) => { isDraggingSlider = true; manualTime = parseInt(e.target.value); });
timeSlider.addEventListener('change', () => { isDraggingSlider = false; });

const clock = new THREE.Clock();

// --- INICIALIZAÇÃO ---
setupSky(scene);
setupCities(scene);
setupParticles(scene); 

// CALLBACK DO EDITOR
setupKingdomEditor((newConfig, shuffleLocations) => {
    // Se clicar em "Mudar Localização", geramos uma seed nova para as cidades
    if (shuffleLocations) {
        state.citySeed = Math.random() * 5000;
        console.log("Sorteando novas posições...");
    }
    
    // ATUALIZA APENAS A POPULAÇÃO (Não recria o terreno)
    updateWorldPopulation(newConfig);
});

function generateWorld() {
    // Gera o Terreno Fixo (Base)
    createTerrain(scene, state.seeds);
    createWater(scene);
    createClouds(); 
    
    // Inicia sem cidades (lista vazia)
    updateWorldPopulation([]); 
    
    console.log("Mundo gerado (Vazio)!");
}

// NOVA FUNÇÃO: Só mexe no que está em cima da terra
function updateWorldPopulation(config) {
    // 1. Cria cidades baseado na config do editor e na seed de cidade
    // Usamos um objeto temporário de seeds combinando a do terreno com a da cidade
    const cityGenSeeds = { x: state.seeds.x + state.citySeed, z: state.seeds.z + state.citySeed };
    
    createCities(state.seeds, null, config); // Passa seeds originais para altura, mas a função createCities vai usar randomização interna
    
    // 2. Recria a vegetação (para cortar árvores onde nasceram cidades)
    createVegetation(scene, state.seeds);
    
    console.log("População atualizada!");
}

generateWorld();

// ... (Resto do código de interação e Animate IGUAL) ...
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
let draggingCity = null; 
const infoDiv = document.getElementById('info');

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);

function onPointerDown(event) {
    if (event.target.closest('button') || event.target.closest('input') || event.target.closest('#kingdom-editor')) return;
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
        
        let raceText = "N/A";
        if (data.races) {
            raceText = `👨 ${data.races.humanos || 0}% | 🧝 ${data.races.elfos || 0}% | 🛡️ ${data.races.anões || 0}%`;
        }
        let raceEl = document.getElementById('cityRaces');
        if(!raceEl) {
            raceEl = document.createElement('p');
            raceEl.id = 'cityRaces';
            infoDiv.appendChild(raceEl);
        }
        raceEl.innerText = raceText;

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
            // Carrega tudo
            createTerrain(scene, state.seeds);
            createWater(scene);
            createCities(state.seeds, data.cities, null);
            createVegetation(scene, state.seeds);
            createClouds();
            e.target.value = '';
        } catch (err) { alert("Erro ao carregar: " + err); }
    };
    reader.readAsText(file);
}
function newGame() {
    state.seeds = { x: Math.random() * 5000, z: Math.random() * 5000 };
    state.stormSeeds = { x: Math.random() * 5000 + 10000, z: Math.random() * 5000 + 10000 };
    generateWorld(); // Gera VAZIO
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
    const delta = clock.getDelta();
    const totalTime = clock.getElapsedTime();
    if (!isDraggingSlider) {
        manualTime += delta * 15; 
        if (manualTime >= 2400) manualTime = 0; 
        timeSlider.value = manualTime; 
    }
    const cycleTime = (manualTime % 2400) / 2400;
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
    const gameHour = Math.floor(cycleTime * 24);
    const gameMin = Math.floor((cycleTime * 24 * 60) % 60);
    document.getElementById('time-display').innerText = `Hora: ${gameHour.toString().padStart(2,'0')}:${gameMin.toString().padStart(2,'0')}`;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}
animate();