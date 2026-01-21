import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
// ADICIONADO: Importar getWorldHeight aqui
import { CONFIG, getWorldHeight } from './utils.js';

let cities = [];
const citiesGroup = new THREE.Group();
const labelsGroup = new THREE.Group();

export function setupCities(scene) {
    scene.add(citiesGroup);
    scene.add(labelsGroup);
}

export function getCities() { return cities; }

// --- FUNÇÃO CORRIGIDA (SÓ UMA VERSÃO AGORA) ---
function isValidLocation(x, z, seeds) {
    // Usa a lógica centralizada do utils.js
    let h = getWorldHeight(x, z, seeds);
    
    // Se a altura for válida (Terra firme, mas não pico de montanha), retorna a altura
    if (h > 1.0 && h < 8.0) return h;
    return null;
}
// ----------------------------------------------

export function createCities(seeds, loadedData = null) {
    // Remove etiquetas antigas do HTML para não duplicar
    const oldLabels = document.querySelectorAll('.label');
    oldLabels.forEach(el => el.remove());

    citiesGroup.clear();
    labelsGroup.clear();
    cities = [];

    // Geometrias
    const castleGeo = new THREE.CylinderGeometry(0.5, 0.8, 3, 5);
    const villageGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    
    const castleMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
    const villageMat = new THREE.MeshStandardMaterial({ color: 0xD2691E });

    const prefixos = ["Port", "São", "Fort", "Nova", "Val", "Grand", "Pedra", "Luz"];
    const sufixos = ["grad", "mouth", "keep", "ia", "dor", "rock", "polis", "mont"];

    if (loadedData) {
        loadedData.forEach(data => {
            const isCastle = data.userData.type.includes("Castelo");
            spawnMesh(data.x, data.y, data.z, data.userData, isCastle, castleGeo, villageGeo, castleMat, villageMat);
        });
    } else {
        const numKingdoms = 6; 

        for (let i = 0; i < numKingdoms; i++) {
            // 1. Tenta achar lugar para o CASTELO
            let cx, cz, ch;
            let foundSpot = false;

            for(let tryK = 0; tryK < 20; tryK++) {
                cx = (Math.random() - 0.5) * (CONFIG.worldSize - 20);
                cz = (Math.random() - 0.5) * (CONFIG.worldSize - 20);
                ch = isValidLocation(cx, cz, seeds);
                
                if (ch !== null) {
                    foundSpot = true;
                    break;
                }
            }

            if (foundSpot) {
                const castleName = "Reino de " + prefixos[Math.floor(Math.random()*prefixos.length)];
                spawnMesh(cx, ch, cz, {
                    name: castleName,
                    pop: Math.floor(Math.random() * 5000) + 2000,
                    type: "Castelo Real"
                }, true, castleGeo, villageGeo, castleMat, villageMat);

                // 2. Cria Vilas ao redor
                const numVillages = Math.floor(Math.random() * 5) + 1;
                
                for(let j=0; j < numVillages; j++) {
                    for(let tryV = 0; tryV < 10; tryV++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 5 + Math.random() * 10;
                        const vx = cx + Math.cos(angle) * dist;
                        const vz = cz + Math.sin(angle) * dist;
                        const vh = isValidLocation(vx, vz, seeds);

                        if (vh !== null) {
                            const vilName = prefixos[Math.floor(Math.random()*prefixos.length)] + " " + sufixos[Math.floor(Math.random()*sufixos.length)];
                            spawnMesh(vx, vh, vz, {
                                name: vilName,
                                pop: Math.floor(Math.random() * 500) + 50,
                                type: "Vila"
                            }, false, castleGeo, villageGeo, castleMat, villageMat);
                            break;
                        }
                    }
                }
            }
        }
    }
}

function spawnMesh(x, h, z, userData, isCastle, cGeo, vGeo, cMat, vMat) {
    const mesh = new THREE.Mesh(isCastle ? cGeo : vGeo, isCastle ? cMat : vMat);
    
    const yOffset = isCastle ? 1.5 : 0.4; 
    mesh.position.set(x, h + yOffset, z);
    
    mesh.castShadow = true; 
    mesh.receiveShadow = true;
    mesh.userData = userData;
    
    citiesGroup.add(mesh);
    cities.push(mesh);

    // Label
    const div = document.createElement('div');
    div.className = 'label ' + (isCastle ? 'label-castle' : 'label-village');
    div.textContent = isCastle ? "👑 " + userData.name : userData.name;
    
    const label = new CSS2DObject(div);
    label.position.set(0, isCastle ? 2.5 : 1.0, 0);
    mesh.add(label);
}