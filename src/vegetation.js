import * as THREE from 'three';
import { noise2D, CONFIG, getWorldHeight } from './utils.js';
import { getCityLocations } from './cities.js'; // <--- IMPORTA A LISTA DE CIDADES

let trunkMesh = null;
let pineMesh = null;
let broadleafMesh = null;
let cactusMesh = null;

const broadleafGeo = new THREE.DodecahedronGeometry(0.6, 0); 
const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 5); 
const pineGeo = new THREE.ConeGeometry(0.5, 1.5, 5);
const cactusGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6);

const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, flatShading: true });
const greenMat = new THREE.MeshStandardMaterial({ color: 0x228B22, flatShading: true });
const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x0E3608, flatShading: true });
const cactusMat = new THREE.MeshStandardMaterial({ color: 0x669900, flatShading: true });

export function createVegetation(scene, seeds) {
    if (trunkMesh) { scene.remove(trunkMesh); trunkMesh = null; }
    if (broadleafMesh) { scene.remove(broadleafMesh); broadleafMesh = null; }
    if (pineMesh) { scene.remove(pineMesh); pineMesh = null; }
    if (cactusMesh) { scene.remove(cactusMesh); cactusMesh = null; }

    const count = 5000;
    const dummy = new THREE.Object3D();

    trunkMesh = new THREE.InstancedMesh(trunkGeo, woodMat, count);
    broadleafMesh = new THREE.InstancedMesh(broadleafGeo, greenMat, count);
    pineMesh = new THREE.InstancedMesh(pineGeo, darkGreenMat, count);
    cactusMesh = new THREE.InstancedMesh(cactusGeo, cactusMat, count);

    [trunkMesh, broadleafMesh, pineMesh, cactusMesh].forEach(m => {
        m.castShadow = true; m.receiveShadow = true;
    });

    let iBroad = 0, iPine = 0, iCactus = 0;
    const sX = seeds.x, sZ = seeds.z;

    // Pega as localizações das cidades geradas ANTES
    const cityLocs = getCityLocations();

    for (let i = 0; i < count * 4; i++) { 
        const x = (Math.random() - 0.5) * CONFIG.worldSize;
        const z = (Math.random() - 0.5) * CONFIG.worldSize;

        // --- VERIFICAÇÃO DE PROXIMIDADE ---
        let tooClose = false;
        for (let k = 0; k < cityLocs.length; k++) {
            const dx = x - cityLocs[k].x;
            const dz = z - cityLocs[k].z;
            const distSq = dx * dx + dz * dz; // Distância ao quadrado (mais rápido)
            
            // Se estiver dentro do raio da cidade, marca como "muito perto"
            if (distSq < cityLocs[k].radius * cityLocs[k].radius) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue; // Pula essa árvore, não planta nada aqui
        // ----------------------------------

        let h = getWorldHeight(x, z, seeds);
        let m = noise2D((x + sX + 1000) * 0.02, (z + sZ + 1000) * 0.02);
        
        if (h > 1.5 && h < 10.0) {
            if (m < -0.3 && h < 6.0) {
                if (iCactus < count) {
                    dummy.position.set(x, h + 0.5, z);
                    dummy.scale.set(1, 0.8 + Math.random() * 0.5, 1);
                    dummy.rotation.set(0, Math.random(), 0);
                    dummy.updateMatrix();
                    cactusMesh.setMatrixAt(iCactus++, dummy.matrix);
                }
            }
            else if (h > 6.0) {
                if (iPine < count) {
                    dummy.position.set(x, h + 0.75, z);
                    dummy.scale.set(1, 1 + Math.random(), 1);
                    dummy.updateMatrix();
                    pineMesh.setMatrixAt(iPine++, dummy.matrix);
                }
            }
            else {
                if (iBroad < count) {
                    const scale = 0.8 + Math.random() * 0.6;
                    
                    dummy.position.set(x, h + 0.3, z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.updateMatrix();
                    trunkMesh.setMatrixAt(iBroad, dummy.matrix);

                    dummy.position.set(x, h + 0.3 + (0.6 * scale), z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.updateMatrix();
                    broadleafMesh.setMatrixAt(iBroad, dummy.matrix);

                    const leafColor = new THREE.Color(0x228B22).offsetHSL(0, 0, Math.random() * 0.2 - 0.1);
                    if(m > 0.5) leafColor.setHex(0x004400); 
                    broadleafMesh.setColorAt(iBroad, leafColor);
                    iBroad++;
                }
            }
        }
    }

    trunkMesh.instanceMatrix.needsUpdate = true;
    broadleafMesh.instanceMatrix.needsUpdate = true;
    broadleafMesh.instanceColor.needsUpdate = true;
    pineMesh.instanceMatrix.needsUpdate = true;
    cactusMesh.instanceMatrix.needsUpdate = true;

    scene.add(trunkMesh);
    scene.add(broadleafMesh);
    scene.add(pineMesh);
    scene.add(cactusMesh);
}