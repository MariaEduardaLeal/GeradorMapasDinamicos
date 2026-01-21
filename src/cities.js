import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG, getWorldHeight } from './utils.js';

let cities = []; 
let cityLocations = []; // Lista de posições para a vegetação ler
let chimneys = [];      // Lista de chaminés para a fumaça
const citiesGroup = new THREE.Group();
const labelsGroup = new THREE.Group();

export function setupCities(scene) {
    scene.add(citiesGroup);
    scene.add(labelsGroup);
}

// --- EXPORTAÇÕES ESSENCIAIS ---
export function getCities() { return cities; }
export function getCityLocations() { return cityLocations; } // <--- O ERRO ESTAVA AQUI (FALTAVA ESSA LINHA)
export function getChimneys() { return chimneys; }
// ------------------------------

function isValidLocation(x, z, seeds) {
    let h = getWorldHeight(x, z, seeds);
    if (h > 1.2 && h < 8.0) return h;
    return null;
}

// --- MODELOS ---
function createHouseModel(userData) {
    const group = new THREE.Group();
    
    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: 0xF5F5DC, flatShading: true }));
    base.position.y = 0.35; base.castShadow = true; base.receiveShadow = true; base.userData = userData;
    group.add(base);

    // Telhado
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.6, 4), new THREE.MeshStandardMaterial({ color: 0xB22222, flatShading: true }));
    roof.position.y = 1.0; roof.rotation.y = Math.PI / 4; roof.castShadow = true; roof.userData = userData;
    group.add(roof);

    // Porta
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x4A3000, side: THREE.DoubleSide }));
    door.position.set(0, 0.35, 0.41); group.add(door);

    // Chaminé
    const chimGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const chimMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const chimney = new THREE.Mesh(chimGeo, chimMat);
    chimney.position.set(0.2, 0.9, 0.2); 
    group.add(chimney);
    
    group.userData.chimneyPos = new THREE.Vector3(0.2, 1.2, 0.2); 

    return group;
}

function createCastleModel(userData) {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x708090, flatShading: true }); 
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x191970, flatShading: true }); 

    const mainTower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.5, 7), wallMat);
    mainTower.position.y = 1.25; mainTower.castShadow = true; mainTower.receiveShadow = true; mainTower.userData = userData;
    group.add(mainTower);

    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 7), roofMat);
    mainRoof.position.y = 3.1; mainRoof.userData = userData;
    group.add(mainRoof);

    const subTowerGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 5);
    const subRoofGeo = new THREE.ConeGeometry(0.35, 0.6, 5);
    [[0.6, 0.6], [-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6]].forEach(pos => {
        const t = new THREE.Mesh(subTowerGeo, wallMat);
        t.position.set(pos[0], 0.75, pos[1]); t.castShadow = true; t.userData = userData; group.add(t);
        const r = new THREE.Mesh(subRoofGeo, roofMat);
        r.position.set(pos[0], 1.8, pos[1]); group.add(r);
    });

    return group;
}

export function createCities(seeds, loadedData = null) {
    const oldLabels = document.querySelectorAll('.label');
    oldLabels.forEach(el => el.remove());

    citiesGroup.clear();
    labelsGroup.clear();
    cities = [];
    cityLocations = [];
    chimneys = [];

    const prefixos = ["Port", "São", "Fort", "Nova", "Val", "Grand", "Pedra", "Luz"];
    const sufixos = ["grad", "mouth", "keep", "ia", "dor", "rock", "polis", "mont"];

    if (loadedData) {
        loadedData.forEach(data => {
            const isCastle = data.userData.type.includes("Castelo");
            spawnCity(data.x, data.y, data.z, data.userData, isCastle);
        });
    } else {
        const numKingdoms = 6; 
        for (let i = 0; i < numKingdoms; i++) {
            let cx, cz, ch, foundSpot = false;
            for(let tryK = 0; tryK < 30; tryK++) {
                cx = (Math.random() - 0.5) * (CONFIG.worldSize - 20);
                cz = (Math.random() - 0.5) * (CONFIG.worldSize - 20);
                ch = isValidLocation(cx, cz, seeds);
                if (ch !== null) { foundSpot = true; break; }
            }

            if (foundSpot) {
                spawnCity(cx, ch, cz, { name: "Reino de " + prefixos[Math.floor(Math.random()*prefixos.length)], pop: Math.floor(Math.random() * 5000) + 2000, type: "Castelo Real" }, true);

                const numVillages = Math.floor(Math.random() * 5) + 2;
                for(let j=0; j < numVillages; j++) {
                    for(let tryV = 0; tryV < 10; tryV++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 6 + Math.random() * 12;
                        const vx = cx + Math.cos(angle) * dist;
                        const vz = cz + Math.sin(angle) * dist;
                        const vh = isValidLocation(vx, vz, seeds);
                        if (vh !== null) {
                            spawnCity(vx, vh, vz, { name: prefixos[Math.floor(Math.random()*prefixos.length)] + " " + sufixos[Math.floor(Math.random()*sufixos.length)], pop: Math.floor(Math.random() * 500) + 50, type: "Vila" }, false);
                            break;
                        }
                    }
                }
            }
        }
    }
}

function spawnCity(x, h, z, userData, isCastle) {
    const model3D = isCastle ? createCastleModel(userData) : createHouseModel(userData);
    model3D.position.set(x, h, z);
    citiesGroup.add(model3D);

    model3D.traverse((child) => { if (child.isMesh) cities.push(child); });

    // Registra localização para vegetação
    cityLocations.push({ x: x, z: z, radius: isCastle ? 12 : 5 });

    // Registra chaminé para fumaça
    if (model3D.userData.chimneyPos) {
        chimneys.push({
            parent: model3D,
            offset: model3D.userData.chimneyPos
        });
    }

    const div = document.createElement('div');
    div.className = 'label ' + (isCastle ? 'label-castle' : 'label-village');
    div.textContent = isCastle ? "👑 " + userData.name : userData.name;
    const label = new CSS2DObject(div);
    label.position.set(0, isCastle ? 4.5 : 1.8, 0); 
    model3D.add(label);
}