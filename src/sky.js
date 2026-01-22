import * as THREE from 'three';
import { CONFIG } from './utils.js';

let sunLight, moonLight, ambientLight, sunMesh, moonMesh;
const cloudsGroup = new THREE.Group();
const clouds = [];

export function setupSky(scene) {
    const defaultSky = CONFIG.colors.skyDay || new THREE.Color(0x87CEEB);
    scene.background = new THREE.Color(defaultSky);

    // Luz Ambiente (Base)
    ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // --- SOL (Luz Quente) ---
    sunLight = new THREE.DirectionalLight(0xffeeb1, 1.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // --- LUA (Luz Fria - NOVO) ---
    moonLight = new THREE.DirectionalLight(0x4444ff, 0.8); // Azulado e forte
    moonLight.castShadow = true;
    moonLight.visible = false; // Começa desligada
    // Configura sombra da lua também
    moonLight.shadow.mapSize.width = 4096;
    moonLight.shadow.mapSize.height = 4096;
    moonLight.shadow.camera.left = -100;
    moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100;
    moonLight.shadow.camera.bottom = -100;
    scene.add(moonLight);

    // Malhas (Visual)
    sunMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshBasicMaterial({ color: 0xFFFF00 }));
    scene.add(sunMesh);

    moonMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xDDDDFF }));
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
            transparent: true, opacity: 0.9, flatShading: true
        });

        const flocos = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < flocos; j++) {
            const mesh = new THREE.Mesh(cloudGeo, mat);
            mesh.position.set((Math.random()-0.5)*3, (Math.random()-0.5)*1.5, (Math.random()-0.5)*2);
            mesh.scale.set(Math.random()*2+1, Math.random()*1.5+1, Math.random()*2+1);
            mesh.castShadow = true; mesh.receiveShadow = true;
            cloudGroup.add(mesh);
        }
        cloudGroup.position.set((Math.random()-0.5)*CONFIG.worldSize*1.5, Math.random()*10+20, (Math.random()-0.5)*CONFIG.worldSize*1.5);
        cloudGroup.userData = { speed: Math.random()*0.05 + 0.02 };
        cloudsGroup.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

export function updateSky(scene, cycleTime) {
    // --- CORREÇÃO DO HORÁRIO ---
    // cycleTime vai de 0.0 a 1.0
    // Queremos:
    // 0.00 (00:00) = Meia noite (Sol embaixo)
    // 0.25 (06:00) = Nascer do sol
    // 0.50 (12:00) = Meio dia (Sol no pico)
    // 0.75 (18:00) = Pôr do sol
    
    // Ajuste matemático: Subtraímos PI/2 para alinhar o ciclo
    const angle = (cycleTime * Math.PI * 2) - (Math.PI / 2);

    const sunX = Math.cos(angle) * 120;
    const sunY = Math.sin(angle) * 120; // Agora sin(-PI/2) é -1 (baixo) e sin(PI/2) é 1 (alto)

    sunMesh.position.set(sunX, sunY, 0);
    moonMesh.position.set(-sunX, -sunY, 0); // Lua oposta ao Sol

    const sunHeight = sunY; // Altura relativa

    // --- CONTROLE DE LUZ (SOL vs LUA) ---
    if (sunHeight >= -5) {
        // DIA
        sunLight.position.copy(sunMesh.position);
        sunLight.visible = true;
        moonLight.visible = false;
        
        // Intensidade do sol cai perto do horizonte
        sunLight.intensity = THREE.MathUtils.mapLinear(sunHeight, -5, 30, 0, 1.5);
        sunLight.intensity = Math.max(0, sunLight.intensity);
    } else {
        // NOITE
        moonLight.position.copy(moonMesh.position);
        moonLight.visible = true;
        sunLight.visible = false;

        // Lua ilumina bem
        moonLight.intensity = 0.8; 
    }

    // --- CORES DO CÉU ---
    let targetColor, fogColor;
    const cDay = CONFIG.colors.skyDay || new THREE.Color(0x87CEEB);
    const cSunset = CONFIG.colors.skySunset || new THREE.Color(0xFF4500);
    const cNight = CONFIG.colors.skyNight || new THREE.Color(0x050510);

    // Interpolação baseada na altura normalizada (-1 a 1)
    const normHeight = Math.sin(angle); 

    if (normHeight > 0.2) {
        targetColor = cDay;
        fogColor = 0x87CEEB;
    } else if (normHeight > -0.2) {
        targetColor = cSunset;
        fogColor = 0xFF4500;
    } else {
        targetColor = cNight;
        fogColor = 0x050510;
    }

    if (scene.background) scene.background.lerp(targetColor, 0.05);
    if (scene.fog) scene.fog.color.lerp(new THREE.Color(fogColor), 0.05);

    // Luz ambiente muda suavemente
    const ambientTarget = normHeight < 0 ? 0.3 : 0.6; // Noite mais clara (0.3) para ver melhor
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, ambientTarget, 0.05);
    
    if (normHeight < 0) ambientLight.color.setHex(0x333388); // Azulado à noite
    else ambientLight.color.setHex(0xFFFFFF);

    // Nuvens
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > CONFIG.worldSize) {
            cloud.position.x = -CONFIG.worldSize;
            cloud.position.z = (Math.random() - 0.5) * CONFIG.worldSize;
        }
    });

    return normHeight; // Retorna altura normalizada para usar nas cidades
}