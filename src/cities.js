import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONFIG, getWorldHeight } from './utils.js';

let cities = []; 
let cityLocations = []; 
let chimneys = [];
let cityLights = []; 
let roadsMesh = null;

const citiesGroup = new THREE.Group();
const labelsGroup = new THREE.Group();

// MATERIAIS
const windowMat = new THREE.MeshStandardMaterial({ color: 0x111100, emissive: 0xFFFF00, emissiveIntensity: 0 });
const torchMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xFF4500, emissiveIntensity: 0 });
const roadGeo = new THREE.CircleGeometry(0.7, 8); roadGeo.rotateX(-Math.PI / 2);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x654321, flatShading: true }); 

export function setupCities(scene) {
    scene.add(citiesGroup);
    scene.add(labelsGroup);
}

export function getCities() { return cities; }
export function getCityLocations() { return cityLocations; }
export function getChimneys() { return chimneys; }

export function updateCityLights(sunHeightNorm) {
    let intensity = 0;
    if (sunHeightNorm < 0.1) {
        intensity = THREE.MathUtils.clamp(1.0 - (sunHeightNorm + 0.5) * 1.5, 0, 1);
    }
    windowMat.emissiveIntensity = intensity * 10.0; 
    torchMat.emissiveIntensity = intensity * 15.0;  
    const flicker = Math.random() * 0.5; 
    cityLights.forEach(light => {
        const maxPower = light.userData.maxIntensity || 10;
        light.intensity = (intensity * maxPower) + (intensity > 0 ? flicker : 0);
        light.visible = intensity > 0.01; 
    });
}

function isValidLocation(x, z, seeds) {
    let h = getWorldHeight(x, z, seeds);
    if (h > 1.2 && h < 8.0) return h;
    return null;
}

function createRoads(kingdoms, seeds) {
    if (roadsMesh) { 
        if(roadsMesh.parent) roadsMesh.parent.remove(roadsMesh);
        roadsMesh.dispose(); 
    }
    const pathPoints = [];
    kingdoms.forEach(k => {
        k.villages.forEach(v => {
            const start = new THREE.Vector3(k.castle.x, 0, k.castle.z);
            const end = new THREE.Vector3(v.x, 0, v.z);
            const dist = start.distanceTo(end);
            const steps = Math.floor(dist / 0.6);
            for(let i=0; i<=steps; i++) {
                const t = i / steps;
                const px = THREE.MathUtils.lerp(start.x, end.x, t);
                const pz = THREE.MathUtils.lerp(start.z, end.z, t);
                const noise = Math.sin(t * Math.PI * 3) * 1.5; 
                pathPoints.push({x: px + noise, z: pz});
            }
        });
    });

    if (pathPoints.length === 0) return;
    roadsMesh = new THREE.InstancedMesh(roadGeo, roadMat, pathPoints.length);
    roadsMesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    
    pathPoints.forEach((p, i) => {
        let h = getWorldHeight(p.x, p.z, seeds);
        if (h < 0.3) h = 0.3;
        dummy.position.set(p.x, h + 0.15, p.z);
        dummy.scale.set(1 + Math.random()*0.4, 1, 1 + Math.random()*0.4); 
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        roadsMesh.setMatrixAt(i, dummy.matrix);
    });
    roadsMesh.instanceMatrix.needsUpdate = true;
    citiesGroup.add(roadsMesh);
}

// --- GERAÇÃO PRINCIPAL COM CONFIGURAÇÃO ---
export function createCities(seeds, loadedData = null, kingdomConfig = null) {
    const oldLabels = document.querySelectorAll('.label');
    oldLabels.forEach(el => el.remove());

    citiesGroup.clear();
    labelsGroup.clear();
    cities = [];
    cityLocations = [];
    chimneys = [];
    cityLights = [];
    
    const kingdomsData = []; 

    // MODO 1: Carregar Save
    if (loadedData) {
        loadedData.forEach(data => {
            const isCastle = data.userData.type.includes("Castelo");
            spawnCity(data.x, data.y, data.z, data.userData, isCastle);
        });
        return; 
    } 

    // MODO 2: Usar Configuração do Editor
    const configToUse = kingdomConfig || [
        { name: "Reino Padrão", villages: 3, races: { humanos: 100 } }
    ];

    configToUse.forEach(kConfig => {
        let cx, cz, ch, foundSpot = false;
        // Tenta achar lugar para o Castelo
        for(let tryK = 0; tryK < 50; tryK++) {
            cx = (Math.random() - 0.5) * (CONFIG.worldSize - 20); 
            cz = (Math.random() - 0.5) * (CONFIG.worldSize - 20);
            ch = isValidLocation(cx, cz, seeds);
            if (ch !== null) { foundSpot = true; break; }
        }

        if (foundSpot) {
            // Cria Castelo com os dados do Editor
            spawnCity(cx, ch, cz, { 
                name: kConfig.name, 
                pop: Math.floor(Math.random() * 5000) + 2000, 
                type: "Castelo Real",
                races: kConfig.races // Salva as raças nos dados
            }, true);
            
            const thisKingdom = { castle: {x: cx, z: cz}, villages: [] };

            // Cria as vilas baseadas no número escolhido
            for(let j=0; j < kConfig.villages; j++) {
                for(let tryV = 0; tryV < 20; tryV++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 6 + Math.random() * 12;
                    const vx = cx + Math.cos(angle) * dist;
                    const vz = cz + Math.sin(angle) * dist;
                    const vh = isValidLocation(vx, vz, seeds);
                    if (vh !== null) {
                        spawnCity(vx, vh, vz, { 
                            name: kConfig.name + " " + (j+1), // Nome simples: Reino X 1, Reino X 2
                            pop: Math.floor(Math.random() * 500) + 50, 
                            type: "Vila",
                            races: kConfig.races 
                        }, false);
                        
                        thisKingdom.villages.push({x: vx, z: vz});
                        break;
                    }
                }
            }
            kingdomsData.push(thisKingdom);
        }
    });
    
    createRoads(kingdomsData, seeds);
}

function spawnCity(x, h, z, userData, isCastle) {
    const model3D = isCastle ? createCastleModel(userData) : createHouseModel(userData);
    model3D.position.set(x, h, z);
    citiesGroup.add(model3D);
    model3D.traverse((child) => { if (child.isMesh) cities.push(child); });
    cityLocations.push({ x: x, z: z, radius: isCastle ? 12 : 5 });
    if (model3D.userData.chimneyPos) { chimneys.push({ parent: model3D, offset: model3D.userData.chimneyPos }); }

    const div = document.createElement('div');
    div.className = 'label ' + (isCastle ? 'label-castle' : 'label-village');
    div.textContent = isCastle ? "👑 " + userData.name : userData.name;
    const label = new CSS2DObject(div);
    label.position.set(0, isCastle ? 4.5 : 1.8, 0); 
    model3D.add(label);
}

// MODELOS (MANTIDOS)
function createHouseModel(userData) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: 0xF5F5DC, flatShading: true }));
    base.position.y = 0.35; base.castShadow = true; base.receiveShadow = true; base.userData = userData; group.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.6, 4), new THREE.MeshStandardMaterial({ color: 0xB22222, flatShading: true }));
    roof.position.y = 1.0; roof.rotation.y = Math.PI / 4; roof.castShadow = true; roof.userData = userData; group.add(roof);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x4A3000, side: THREE.DoubleSide }));
    door.position.set(0, 0.35, 0.41); group.add(door);
    const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), windowMat);
    windowMesh.position.set(0.41, 0.45, 0); windowMesh.rotation.y = Math.PI / 2; group.add(windowMesh);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    chimney.position.set(0.2, 0.9, 0.2); group.add(chimney); group.userData.chimneyPos = new THREE.Vector3(0.2, 1.2, 0.2); 
    const houseLight = new THREE.PointLight(0xFFAA00, 0, 10); houseLight.position.set(0, 1.5, 0); houseLight.userData = { maxIntensity: 10.0 }; group.add(houseLight); cityLights.push(houseLight);
    return group;
}

function createCastleModel(userData) {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x708090, flatShading: true }); 
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x191970, flatShading: true }); 
    const mainTower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.5, 7), wallMat);
    mainTower.position.y = 1.25; mainTower.castShadow = true; mainTower.receiveShadow = true; mainTower.userData = userData; group.add(mainTower);
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 7), roofMat);
    mainRoof.position.y = 3.1; mainRoof.userData = userData; group.add(mainRoof);
    const subTowerGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 5);
    const subRoofGeo = new THREE.ConeGeometry(0.35, 0.6, 5);
    const torchGeo = new THREE.SphereGeometry(0.15, 4, 4); 
    [[0.6, 0.6], [-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6]].forEach((pos) => {
        const t = new THREE.Mesh(subTowerGeo, wallMat); t.position.set(pos[0], 0.75, pos[1]); t.castShadow = true; t.userData = userData; group.add(t);
        const r = new THREE.Mesh(subRoofGeo, roofMat); r.position.set(pos[0], 1.8, pos[1]); group.add(r);
        const torch = new THREE.Mesh(torchGeo, torchMat); torch.position.set(pos[0], 2.2, pos[1]); group.add(torch);
    });
    const castleLight = new THREE.PointLight(0xFF6600, 0, 30); castleLight.position.set(0, 2.5, 0); castleLight.userData = { maxIntensity: 85.0 }; group.add(castleLight); cityLights.push(castleLight);
    return group;
}