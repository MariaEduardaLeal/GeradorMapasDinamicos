import * as THREE from 'three';
import { noise2D, CONFIG } from './utils.js';

let cities = [];
const citiesGroup = new THREE.Group();

export function setupCities(scene) {
    scene.add(citiesGroup);
}

export function getCities() { return cities; }

export function createCities(seeds, loadedData = null) {
    citiesGroup.clear();
    cities = [];

    const cityGeometry = new THREE.CylinderGeometry(0.2, 0.6, 1.5, 4);
    const cityMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });

    if (loadedData) {
        loadedData.forEach(data => {
            const city = new THREE.Mesh(cityGeometry, cityMaterial);
            city.position.set(data.x, data.y, data.z);
            city.castShadow = true; city.receiveShadow = true;
            city.userData = data.userData;
            citiesGroup.add(city);
            cities.push(city);
        });
    } else {
        const prefixos = ["Port", "São", "Fort", "Nova", "Val", "Grand"];
        const sufixos = ["grad", "mouth", "keep", "ia", "dor", "rock"];

        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * (CONFIG.worldSize - 10);
            const z = (Math.random() - 0.5) * (CONFIG.worldSize - 10);
            
            let h = noise2D((x + seeds.x) * 0.02, (z + seeds.z) * 0.02);
            h += noise2D((x + seeds.x) * 0.06, (z + seeds.z) * 0.06) * 0.5;
            h *= 8;

            if (h > 1.5 && h < 5.0) {
                const city = new THREE.Mesh(cityGeometry, cityMaterial);
                city.position.set(x, h + 0.75, z);
                city.castShadow = true; city.receiveShadow = true;
                city.userData = {
                    name: prefixos[Math.floor(Math.random()*prefixos.length)] + " " + sufixos[Math.floor(Math.random()*sufixos.length)],
                    pop: Math.floor(Math.random() * 5000) + 100,
                    type: Math.random() > 0.5 ? "Vila Comercial" : "Forte Militar"
                };
                citiesGroup.add(city);
                cities.push(city);
                if (cities.length >= 12) break;
            }
        }
    }
}