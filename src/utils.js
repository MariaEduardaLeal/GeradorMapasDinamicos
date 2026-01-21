import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

export const noise2D = createNoise2D();

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
        desert: new THREE.Color(0xF4A460), // Laranja areia
        jungle: new THREE.Color(0x004400),  // Verde escuro intenso
        
        skyDay: new THREE.Color(0x87CEEB),
        skySunset: new THREE.Color(0xFF4500),
        skyNight: new THREE.Color(0x050510)
    }
};