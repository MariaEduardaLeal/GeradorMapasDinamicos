import * as THREE from 'three';
import { noise2D, CONFIG } from './utils.js';

let terrainMesh = null;

export function createTerrain(scene, seeds) {
    if (terrainMesh) {
        terrainMesh.geometry.dispose();
        terrainMesh.material.dispose();
        scene.remove(terrainMesh);
    }

    const geometry = new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize, CONFIG.resolution, CONFIG.resolution);
    geometry.rotateX(-Math.PI / 2);
    
    const vertices = geometry.attributes.position;
    const colors = [];

    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ(i);

        // 1. Cálculo da Altura (Elevation)
        let h = noise2D((x + seeds.x) * 0.02, (z + seeds.z) * 0.02);
        h += noise2D((x + seeds.x) * 0.06, (z + seeds.z) * 0.06) * 0.5;
        h *= 8;

        // 2. Cálculo da Umidade (Moisture)
        // Usamos um offset (+1000) para o mapa de umidade ser diferente do mapa de altura
        let m = noise2D((x + seeds.x + 1000) * 0.03, (z + seeds.z + 1000) * 0.03);

        vertices.setY(i, h);

        // 3. Definição de Bioma (Cor do Chão)
        let c;
        if (h < -2.0) c = CONFIG.colors.deep;
        else if (h < 0.2) c = CONFIG.colors.water;
        else if (h < 1.5) {
             // Praias
             c = CONFIG.colors.sand;
        } 
        else if (h > 8.0) {
            // Picos muito altos (sempre neve)
            c = CONFIG.colors.snow;
        }
        else {
            // Terra firme: Decide baseado na umidade
            if (m < -0.4) c = CONFIG.colors.desert; // Muito seco
            else if (m > 0.4) c = CONFIG.colors.jungle; // Muito úmido
            else c = CONFIG.colors.grass; // Normal
        }
        
        colors.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 });
    terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    
    scene.add(terrainMesh);
    return terrainMesh;
}