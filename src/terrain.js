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

        let elevation = noise2D((x + seeds.x) * 0.02, (z + seeds.z) * 0.02);
        elevation += noise2D((x + seeds.x) * 0.06, (z + seeds.z) * 0.06) * 0.5;
        elevation *= 8;

        vertices.setY(i, elevation);

        let c;
        if (elevation < -2.0) c = CONFIG.colors.deep;
        else if (elevation < 0.2) c = CONFIG.colors.water;
        else if (elevation < 1.5) c = CONFIG.colors.sand;
        else if (elevation < 5.5) c = CONFIG.colors.grass;
        else if (elevation < 8.5) c = CONFIG.colors.rock;
        else c = CONFIG.colors.snow;
        
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