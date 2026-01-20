import * as THREE from 'three';
import { noise2D, CONFIG } from './utils.js';

let waterMesh = null;

export function createWater(scene) {
    if (waterMesh) {
        waterMesh.geometry.dispose();
        waterMesh.material.dispose();
        scene.remove(waterMesh);
    }

    const geometry = new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.worldSize, CONFIG.resolution, CONFIG.resolution);
    geometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x1E90FF, transparent: true, opacity: 0.75,
        roughness: 0.1, metalness: 0.6, flatShading: true
    });

    waterMesh = new THREE.Mesh(geometry, material);
    waterMesh.position.y = 0.2;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    return waterMesh;
}

export function updateWater(totalTime, stormSeeds) {
    if (!waterMesh) return;

    const position = waterMesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const z = position.getZ(i);
        
        // Mapa de tempestade
        let stormNoise = noise2D((x + stormSeeds.x) * 0.04, (z + stormSeeds.z) * 0.04);
        let stormIntensity = stormNoise > 0.3 ? (stormNoise - 0.3) * 2.0 : 0;
        
        let finalHeight = 0.2 + (stormIntensity * 1.5);
        let finalSpeed = 1.0 + (stormIntensity * 2.0);

        const y = Math.sin(x * 0.3 + totalTime * finalSpeed + stormNoise * 5) * finalHeight 
                + Math.cos(z * 0.2 + totalTime * finalSpeed) * (finalHeight * 0.5);
        
        position.setY(i, y);
    }
    position.needsUpdate = true;
    waterMesh.geometry.computeVertexNormals();
}