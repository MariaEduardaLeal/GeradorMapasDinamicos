import * as THREE from 'three';
import { noise2D, CONFIG } from './utils.js';

let trunksMesh = null;
let leavesMesh = null;

// Geometrias reutilizáveis (Low Poly)
const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 5); // Tronco hexagonal/pentagonal
const leavesGeo = new THREE.ConeGeometry(0.6, 1.2, 5); // Copa cônica

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, flatShading: true });
const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22, flatShading: true });

export function createVegetation(scene, seeds) {
    // 1. Limpeza
    if (trunksMesh) {
        trunksMesh.dispose(); // Função auxiliar para limpar do InstancedMesh se existisse
        scene.remove(trunksMesh);
    }
    if (leavesMesh) {
        scene.remove(leavesMesh);
    }

    // 2. Configuração
    const treeCount = 4000; // Quantidade máxima de árvores
    const dummy = new THREE.Object3D(); // Objeto auxiliar para calcular posições
    
    // InstancedMesh: O segredo da performance
    trunksMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, treeCount);
    
    trunksMesh.castShadow = true; trunksMesh.receiveShadow = true;
    leavesMesh.castShadow = true; leavesMesh.receiveShadow = true;

    let index = 0;
    const sX = seeds.x;
    const sZ = seeds.z;

    // 3. Espalhar árvores
    // Tentamos posições aleatórias até preencher o limite ou cansar
    for (let i = 0; i < treeCount * 2; i++) {
        if (index >= treeCount) break;

        const x = (Math.random() - 0.5) * CONFIG.worldSize;
        const z = (Math.random() - 0.5) * CONFIG.worldSize;

        // Recalcula a altura do terreno neste ponto exato
        let h = noise2D((x + sX) * 0.02, (z + sZ) * 0.02);
        h += noise2D((x + sX) * 0.06, (z + sZ) * 0.06) * 0.5;
        h *= 8;

        // Regras de Plantio:
        // - Altura > 1.8 (Não nasce na areia/água)
        // - Altura < 6.5 (Não nasce na pedra/neve)
        // - Noise Extra: Cria "manchas" de floresta densa e clareiras
        const density = noise2D((x + sX) * 0.1, (z + sZ) * 0.1); // Ruído de alta frequência para agrupar árvores

        if (h > 1.8 && h < 6.5 && density > -0.2) {
            
            // Variação de tamanho
            const scale = 0.8 + Math.random() * 0.6; 

            // -- Posicionar Tronco --
            dummy.position.set(x, h + 0.3, z); // +0.3 para metade do tronco ficar pra fora
            dummy.rotation.set(0, Math.random() * Math.PI, 0); // Rotação aleatória
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            trunksMesh.setMatrixAt(index, dummy.matrix);

            // -- Posicionar Copa --
            dummy.position.set(x, h + 0.3 + (0.6 * scale), z); // Em cima do tronco
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            leavesMesh.setMatrixAt(index, dummy.matrix);
            
            // Variação de cor da folha (Verde claro a escuro)
            const colorVar = Math.random() * 0.2;
            const leafColor = new THREE.Color(0x228B22).offsetHSL(0, 0, colorVar - 0.1);
            leavesMesh.setColorAt(index, leafColor);

            index++;
        }
    }

    // Importante: Avisar ao Three.js que as matrizes estão prontas
    trunksMesh.instanceMatrix.needsUpdate = true;
    leavesMesh.instanceMatrix.needsUpdate = true;
    leavesMesh.instanceColor.needsUpdate = true; // Necessário para cores variadas

    scene.add(trunksMesh);
    scene.add(leavesMesh);
}