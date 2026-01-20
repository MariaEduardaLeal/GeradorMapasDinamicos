import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

export const noise2D = createNoise2D();

// Configurações do Mundo
export const CONFIG = {
    worldSize: 200,
    resolution: 190,
    dayDuration: 600,
    colors: {
        deep: new THREE.Color(0x00008B),
        water: new THREE.Color(0x1E90FF),
        sand: new THREE.Color(0xE6C288),
        grass: new THREE.Color(0x228B22),
        rock: new THREE.Color(0x696969),
        snow: new THREE.Color(0xFFFFFF),
        skyDay: new THREE.Color(0x87CEEB),
        skySunset: new THREE.Color(0xFF4500),
        skyNight: new THREE.Color(0x050510)
    }
};