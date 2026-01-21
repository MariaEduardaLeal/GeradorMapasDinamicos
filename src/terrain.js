// src/terrain.js
import * as THREE from 'three';
import { noise2D, CONFIG, getWorldHeight } from './utils.js'; // <--- Importe a nova função

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

        // --- USA A LÓGICA CENTRALIZADA ---
        let h = getWorldHeight(x, z, seeds);
        // ---------------------------------

        let m = noise2D((x + seeds.x + 1000) * 0.02, (z + seeds.z + 1000) * 0.02); // Umidade com freq menor também

        vertices.setY(i, h);

        let c;
        // Ajustei levemente os níveis da água para bater com a nova altura
        if (h < -3.0) c = CONFIG.colors.deep;
        else if (h < -0.5) c = CONFIG.colors.water; // Nível do mar visual
        else if (h < 1.0) c = CONFIG.colors.sand;   // Praias
        else if (h > 9.0) c = CONFIG.colors.snow;   // Picos
        else {
            if (m < -0.3) c = CONFIG.colors.desert;
            else if (m > 0.3) c = CONFIG.colors.jungle;
            else c = CONFIG.colors.grass;
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