import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { noise2D, CONFIG } from './utils.js';

let cities = [];
const citiesGroup = new THREE.Group();
const labelsGroup = new THREE.Group(); // Grupo para as etiquetas

export function setupCities(scene) {
    scene.add(citiesGroup);
    scene.add(labelsGroup);
}

export function getCities() { return cities; }

// Função auxiliar para verificar se o terreno é válido (Terra firme, não muito alto)
function isValidLocation(x, z, seeds) {
    let h = noise2D((x + seeds.x) * 0.02, (z + seeds.z) * 0.02);
    h += noise2D((x + seeds.x) * 0.06, (z + seeds.z) * 0.06) * 0.5;
    h *= 8;
    
    // Retorna a altura se for válido (Terra firme: > 1.5 e < 7.0), senão null
    if (h > 1.8 && h < 7.0) return h;
    return null;
}

export function createCities(seeds, loadedData = null) {
    const oldLabels = document.querySelectorAll('.label');
    oldLabels.forEach(el => el.remove());
    
    citiesGroup.clear();
    labelsGroup.clear();
    cities = [];

    // Geometrias reutilizáveis (Low Poly)
    const castleGeo = new THREE.CylinderGeometry(0.5, 0.8, 3, 5); // Castelo mais alto e imponente
    const villageGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Vilas são casinhas cúbicas
    
    const castleMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 }); // Vermelho Real
    const villageMat = new THREE.MeshStandardMaterial({ color: 0xD2691E }); // Marrom Telhado

    const prefixos = ["Port", "São", "Fort", "Nova", "Val", "Grand", "Pedra", "Luz"];
    const sufixos = ["grad", "mouth", "keep", "ia", "dor", "rock", "polis", "mont"];

    if (loadedData) {
        // Lógica de carregar (mantida simples)
        loadedData.forEach(data => {
            const isCastle = data.userData.type.includes("Castelo");
            spawnMesh(data.x, data.y, data.z, data.userData, isCastle, castleGeo, villageGeo, castleMat, villageMat);
        });
    } else {
        const numKingdoms = 6; // Tenta criar 6 reinos

        for (let i = 0; i < numKingdoms; i++) {
            // 1. Tenta achar lugar para o CASTELO
            let cx, cz, ch;
            let foundSpot = false;

            // Tenta 20 vezes achar um lugar para o castelo
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
                // Cria o Castelo
                const castleName = "Reino de " + prefixos[Math.floor(Math.random()*prefixos.length)];
                spawnMesh(cx, ch, cz, {
                    name: castleName,
                    pop: Math.floor(Math.random() * 5000) + 2000,
                    type: "Castelo Real"
                }, true, castleGeo, villageGeo, castleMat, villageMat);

                // 2. Cria Vilas ao redor do Castelo
                const numVillages = Math.floor(Math.random() * 5) + 1; // 1 a 5 vilas
                
                for(let j=0; j < numVillages; j++) {
                    // Tenta achar lugar num raio de 5 a 15 unidades do castelo
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
                            break; // Achou lugar, sai do loop de tentativas e vai pra proxima vila
                        }
                    }
                }
            }
        }
    }
}

function spawnMesh(x, h, z, userData, isCastle, cGeo, vGeo, cMat, vMat) {
    const mesh = new THREE.Mesh(isCastle ? cGeo : vGeo, isCastle ? cMat : vMat);
    
    // Ajuste de altura (pivô)
    const yOffset = isCastle ? 1.5 : 0.4; 
    mesh.position.set(x, h + yOffset, z);
    
    mesh.castShadow = true; 
    mesh.receiveShadow = true;
    mesh.userData = userData;
    
    citiesGroup.add(mesh);
    cities.push(mesh);

    // --- CRIAR LABEL FLUTUANTE ---
    const div = document.createElement('div');
    div.className = 'label ' + (isCastle ? 'label-castle' : 'label-village');
    div.textContent = isCastle ? "👑 " + userData.name : userData.name;
    
    const label = new CSS2DObject(div);
    label.position.set(0, isCastle ? 2.5 : 1.0, 0); // Posição relativa ao mesh
    mesh.add(label); // Adiciona como filho do mesh para seguir a posição
    
    // Hack: Adiciona ao grupo de labels também se precisar gerenciar visibilidade global
    // mas adicionar como filho do mesh já resolve o posicionamento.
}