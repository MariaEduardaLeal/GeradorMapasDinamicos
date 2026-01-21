import * as THREE from 'three';
import { CONFIG } from './utils.js';

let sunLight, ambientLight, sunMesh, moonMesh;
const cloudsGroup = new THREE.Group();
const clouds = [];

export function setupSky(scene) {
    const defaultSky = CONFIG.colors.skyDay || new THREE.Color(0x87CEEB);
    scene.background = new THREE.Color(defaultSky);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xffeeb1, 1.5);
    sunLight.castShadow = true;
    
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.bias = -0.0005;
    
    scene.add(sunLight);

    sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xFFFF00 })
    );
    scene.add(sunMesh);

    moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xDDDDFF })
    );
    scene.add(moonMesh);

    scene.add(cloudsGroup);
}

export function createClouds() {
    cloudsGroup.clear();
    clouds.length = 0;
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 30; i++) {
        const cloudGroup = new THREE.Group();
        const isRain = Math.random() < 0.2;
        const mat = new THREE.MeshStandardMaterial({
            color: isRain ? 0x555555 : 0xffffff,
            transparent: true,
            opacity: 0.9,
            flatShading: true
        });

        const flocos = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < flocos; j++) {
            const mesh = new THREE.Mesh(cloudGeo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 2
            );
            mesh.scale.set(
                Math.random() * 2 + 1,
                Math.random() * 1.5 + 1,
                Math.random() * 2 + 1
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            cloudGroup.add(mesh);
        }
        
        cloudGroup.position.set(
            (Math.random() - 0.5) * CONFIG.worldSize * 1.5,
            Math.random() * 10 + 20,
            (Math.random() - 0.5) * CONFIG.worldSize * 1.5
        );
        
        cloudGroup.userData = { speed: Math.random() * 0.05 + 0.02 };
        cloudsGroup.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

export function updateSky(scene, cycleTime) {
    const angle = cycleTime * Math.PI * 2;
    const sunX = Math.cos(angle) * 120;
    const sunY = Math.sin(angle) * 120;

    sunMesh.position.set(sunX, sunY, 0);
    sunLight.position.copy(sunMesh.position);
    moonMesh.position.set(-sunX, -sunY, 0);

    const sunHeight = Math.sin(angle);
    let targetColor, fogColor, lightIntensity;

    // Garante que as cores existam (fallback)
    const cDay = CONFIG.colors.skyDay || new THREE.Color(0x87CEEB);
    const cSunset = CONFIG.colors.skySunset || new THREE.Color(0xFF4500);
    const cNight = CONFIG.colors.skyNight || new THREE.Color(0x050510);

    if (sunHeight > 0.2) {
        targetColor = cDay;
        fogColor = 0x87CEEB;
        lightIntensity = 1.5;
    } else if (sunHeight > -0.2) {
        targetColor = cSunset;
        fogColor = 0xFF4500;
        lightIntensity = 0.5;
    } else {
        targetColor = cNight;
        fogColor = 0x050510;
        lightIntensity = 0.0;
    }

    // Proteção: Se background não existir, cria.
    if (!scene.background) {
        scene.background = new THREE.Color(targetColor);
    }

    // Proteção: Só faz o lerp se targetColor for válido
    if (targetColor && targetColor.isColor) {
        scene.background.lerp(targetColor, 0.01);
    }
    
    if (scene.fog) {
        scene.fog.color.lerp(new THREE.Color(fogColor), 0.01);
    }
    
    sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, lightIntensity, 0.05);

    const ambientTarget = sunHeight < 0 ? 0.3 : 0.6;
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, ambientTarget, 0.01);
    
    if (sunHeight < 0) ambientLight.color.setHex(0x5555AA);
    else ambientLight.color.setHex(0xFFFFFF);

    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > CONFIG.worldSize) {
            cloud.position.x = -CONFIG.worldSize;
            cloud.position.z = (Math.random() - 0.5) * CONFIG.worldSize;
        }
    });
}