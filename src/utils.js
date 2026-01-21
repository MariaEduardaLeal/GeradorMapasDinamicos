// src/utils.js

import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

export const noise2D = createNoise2D();

// ... (Mantenha as configs de cores e constantes aqui como estavam) ...

export const CONFIG = {
    worldSize: 200, // Pode aumentar para 300 se quiser continentes maiores
    resolution: 190,
    dayDuration: 600,
    colors: {
        deep: new THREE.Color(0x00008B),
        water: new THREE.Color(0x1E90FF),
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


export function getWorldHeight(x, z, seeds) {
    // Frequência: 0.007 (Antes era 0.02) -> Cria formas muito maiores (Continentes)
    let base = noise2D((x + seeds.x) * 0.007, (z + seeds.z) * 0.007);
    
    // Viés: +0.25 -> Empurra tudo pra cima (Transforma mar raso em terra)
    base += 0.25; 

    // Detalhes: Adiciona rugosidade para não ficar muito liso
    let detail = noise2D((x + seeds.x) * 0.03, (z + seeds.z) * 0.03) * 0.5;
    
    // Multiplicador Final: 12 -> Altura máxima das montanhas
    return (base + detail) * 12; 
}