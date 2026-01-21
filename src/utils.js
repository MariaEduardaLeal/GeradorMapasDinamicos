import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

export const noise2D = createNoise2D();

const seedElevationX = Math.random() * 5000;
const seedElevationZ = Math.random() * 5000;
const seedTempX = Math.random() * 5000 + 10000;
const seedTempZ = Math.random() * 5000 + 10000;

const worldSize = 340;
const resolution = 200;
const geometry = new THREE.PlaneGeometry(worldSize, worldSize, resolution, resolution);
geometry.rotateX(-Math.PI / 2);

const vertices = geometry.attributes.position;
const colors = [];

// ÁGUA
const C_WATER_DEEP = new THREE.Color(0x1E90FF);
const C_WATER_ICE = new THREE.Color(0x88DFFF); // Água congelada

// BIOMA 1: GELO (Muito Frio)
const C_ICE = new THREE.Color(0xFFFFFF);
const C_ICE_ROCK = new THREE.Color(0x708090);

// BIOMA 2: TUNDRA (Frio -> Temperado)
const C_TUNDRA_GRASS = new THREE.Color(0x556B2F); // Verde musgo desbotado
const C_TUNDRA_ROCK = new THREE.Color(0x696969);

// BIOMA 3: TEMPERADO (Médio)
const C_SAND = new THREE.Color(0xE6C288);
const C_GRASS = new THREE.Color(0x3CB371);
const C_FOREST = new THREE.Color(0x228B22);
const C_ROCK = new THREE.Color(0x505050);

// BIOMA 4: SAVANA (Temperado -> Quente)
const C_SAVANNA_GRASS = new THREE.Color(0x9ACD32); // Verde amarelado
const C_SAVANNA_DRY = new THREE.Color(0xBDB76B);   // Khaki

// BIOMA 5: DESERTO (Muito Quente)
const C_DESERT_SAND = new THREE.Color(0xEDC9Af);
const C_DESERT_ROCK = new THREE.Color(0x8B4513);

for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);

    // 1. ALTURA (Diminuí a frequência 0.015 -> 0.01 para continentes maiores)
    let nBase = noise2D((x + seedElevationX) * 0.01, (z + seedElevationZ) * 0.01);
    let nDet = noise2D((x + seedElevationX) * 0.05, (z + seedElevationZ) * 0.05) * 0.3;
    let nRock = noise2D((x + seedElevationX) * 0.15, (z + seedElevationZ) * 0.15) * 0.1;
    let elevation = (nBase + nDet + nRock) * 12; // Aumentei a altura geral

    // 2. TEMPERATURA (Frequência bem baixa para transições suaves)
    let temperature = noise2D((x + seedTempX) * 0.008, (z + seedTempZ) * 0.008);

    vertices.setY(i, elevation);

    let c;

    // === LÓGICA DE REGRAS DE BIOMA ===

    // --- NÍVEL DO MAR ---
    if (elevation < 0.2) {
        if (temperature < -0.5) c = C_WATER_ICE; // Pólos congelados
        else c = C_WATER_DEEP;
    }
    // --- TERRA FIRME ---
    else {
        // Seleção baseada em faixas de temperatura

        // 1. GELO (Extremo Frio: < -0.5)
        if (temperature < -0.5) {
            if (elevation < 2) c = C_ICE; // Neve plana
            else c = C_ICE_ROCK;         // Montanha nua
        }
        // 2. TUNDRA (Frio: -0.5 a -0.2)
        else if (temperature < -0.2) {
            if (elevation < 4) c = C_TUNDRA_GRASS;
            else if (elevation < 8) c = C_TUNDRA_ROCK;
            else c = C_ICE; // Picos com neve
        }
        // 3. TEMPERADO (Médio: -0.2 a 0.25)
        else if (temperature < 0.25) {
            if (elevation < 1.0) c = C_SAND;       // Praia
            else if (elevation < 5.0) c = C_GRASS; // Campo
            else if (elevation < 8.0) c = C_FOREST;// Floresta
            else if (elevation < 11.0) c = C_ROCK; // Pedra
            else c = C_ICE;                       // Pico Nevado
        }
        // 4. SAVANA (Quente: 0.25 a 0.55) - O "Buffer" do deserto
        else if (temperature < 0.55) {
            if (elevation < 1.0) c = C_SAND;
            else if (elevation < 5.0) c = C_SAVANNA_GRASS;
            else if (elevation < 9.0) c = C_SAVANNA_DRY;
            else c = C_ROCK; // Montanhas secas (sem neve)
        }
        // 5. DESERTO (Extremo Quente: > 0.55)
        else {
            if (elevation < 3.0) c = C_DESERT_SAND; // Dunas
            else if (elevation < 8.0) c = C_DESERT_ROCK; // Canyons
            else c = C_DESERT_ROCK.clone().multiplyScalar(0.8); // Topo escuro
        }
    }

    colors.push(c.r, c.g, c.b);
}



export const CONFIG = {
    worldSize: 140,
    resolution: 150,
    dayDuration: 600,
    colors: {
        deep: new THREE.Color(0x00008B),
        water: new THREE.Color(0x1E90FF),
        // Biomas
        sand: new THREE.Color(0xE6C288),
        grass: new THREE.Color(0x228B22),
        forest: new THREE.Color(0x006400),
        rock: new THREE.Color(0x696969),
        snow: new THREE.Color(0xFFFFFF),
        desert: new THREE.Color(0xF4A460),
        jungle: new THREE.Color(0x004400),

        skyDay: new THREE.Color(0x87CEEB),
        skySunset: new THREE.Color(0xFF4500),
        skyNight: new THREE.Color(0x050510)
    }
};