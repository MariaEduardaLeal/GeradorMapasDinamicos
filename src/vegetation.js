import * as THREE from 'three';
import { noise2D, CONFIG } from './utils.js';

// Variáveis globais para armazenar as malhas atuais
let trunkMesh = null;
let pineMesh = null;
let broadleafMesh = null;
let cactusMesh = null;

// --- GEOMETRIAS (Reutilizáveis) ---
// Dodecaedro: Raio 0.6, Detalhe 0 (Garante o visual Low Poly)
const broadleafGeo = new THREE.DodecahedronGeometry(0.6, 0); 
const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 5); 
const pineGeo = new THREE.ConeGeometry(0.5, 1.5, 5);
const cactusGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6);

// --- MATERIAIS ---
const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, flatShading: true });
const greenMat = new THREE.MeshStandardMaterial({ color: 0x228B22, flatShading: true });
const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x0E3608, flatShading: true });
const cactusMat = new THREE.MeshStandardMaterial({ color: 0x669900, flatShading: true });

export function createVegetation(scene, seeds) {
    // --- LIMPEZA DE MEMÓRIA ---
    // Removemos apenas os meshes da cena. 
    // NÃO usamos dispose() aqui porque queremos reutilizar as geometrias const acima.
    if (trunkMesh) {
        scene.remove(trunkMesh);
        trunkMesh = null;
    }
    if (broadleafMesh) {
        scene.remove(broadleafMesh);
        broadleafMesh = null;
    }
    if (pineMesh) {
        scene.remove(pineMesh);
        pineMesh = null;
    }
    if (cactusMesh) {
        scene.remove(cactusMesh);
        cactusMesh = null;
    }

    const count = 3000;
    const dummy = new THREE.Object3D();

    // Criação dos InstancedMeshes
    trunkMesh = new THREE.InstancedMesh(trunkGeo, woodMat, count);
    broadleafMesh = new THREE.InstancedMesh(broadleafGeo, greenMat, count);
    pineMesh = new THREE.InstancedMesh(pineGeo, darkGreenMat, count);
    cactusMesh = new THREE.InstancedMesh(cactusGeo, cactusMat, count);

    // Habilita sombras
    [trunkMesh, broadleafMesh, pineMesh, cactusMesh].forEach(m => {
        m.castShadow = true; m.receiveShadow = true;
    });

    // Contadores
    let iBroad = 0;
    let iPine = 0;
    let iCactus = 0;

    const sX = seeds.x;
    const sZ = seeds.z;

    for (let i = 0; i < count * 3; i++) {
        const x = (Math.random() - 0.5) * CONFIG.worldSize;
        const z = (Math.random() - 0.5) * CONFIG.worldSize;

        // Cálculo de Altura
        let h = noise2D((x + sX) * 0.02, (z + sZ) * 0.02);
        h += noise2D((x + sX) * 0.06, (z + sZ) * 0.06) * 0.5;
        h *= 8;

        // Cálculo de Umidade
        let m = noise2D((x + sX + 1000) * 0.03, (z + sZ + 1000) * 0.03);
        const density = noise2D((x + sX) * 0.1, (z + sZ) * 0.1);

        // Apenas planta se estiver em terra firme (acima da areia, abaixo dos picos mais altos)
        if (h > 1.8 && h < 9.0 && density > -0.3) {
            
            // BIOMA: DESERTO (Baixo e Seco)
            if (m < -0.4 && h < 6.0) {
                if (iCactus < count) {
                    dummy.position.set(x, h + 0.5, z);
                    dummy.scale.set(1, 0.8 + Math.random() * 0.5, 1);
                    dummy.rotation.set(0, Math.random(), 0);
                    dummy.updateMatrix();
                    cactusMesh.setMatrixAt(iCactus++, dummy.matrix);
                }
            }
            // BIOMA: NEVE (Alto)
            else if (h > 6.0) {
                if (iPine < count) {
                    dummy.position.set(x, h + 0.75, z);
                    dummy.scale.set(1, 1 + Math.random(), 1);
                    dummy.updateMatrix();
                    pineMesh.setMatrixAt(iPine++, dummy.matrix);
                }
            }
            // BIOMA: FLORESTA (O resto)
            else {
                if (iBroad < count) {
                    const scale = 0.8 + Math.random() * 0.6;
                    
                    // Tronco
                    dummy.position.set(x, h + 0.3, z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.updateMatrix();
                    trunkMesh.setMatrixAt(iBroad, dummy.matrix);

                    // Copa
                    dummy.position.set(x, h + 0.3 + (0.6 * scale), z);
                    dummy.scale.set(scale, scale, scale);
                    dummy.updateMatrix();
                    broadleafMesh.setMatrixAt(iBroad, dummy.matrix);

                    // Variação de cor da folha
                    const leafColor = new THREE.Color(0x228B22).offsetHSL(0, 0, Math.random() * 0.2 - 0.1);
                    if(m > 0.5) leafColor.setHex(0x004400); 
                    broadleafMesh.setColorAt(iBroad, leafColor);
                    
                    iBroad++;
                }
            }
        }
    }

    // Atualiza as matrizes para renderizar
    trunkMesh.instanceMatrix.needsUpdate = true;
    broadleafMesh.instanceMatrix.needsUpdate = true;
    broadleafMesh.instanceColor.needsUpdate = true;
    pineMesh.instanceMatrix.needsUpdate = true;
    cactusMesh.instanceMatrix.needsUpdate = true;

    // Adiciona à cena
    scene.add(trunkMesh);
    scene.add(broadleafMesh);
    scene.add(pineMesh);
    scene.add(cactusMesh);
}