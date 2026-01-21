import * as THREE from 'three';

let mesh;
const dummy = new THREE.Object3D();
const particleCount = 1000; // Máximo de partículas na tela
const particles = []; // Dados de cada partícula (posição, vida, velocidade)

// Geometria e Material da Fumaça (Low Poly)
const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const material = new THREE.MeshStandardMaterial({
    color: 0x555555,
    transparent: true,
    opacity: 0.6,
    flatShading: true
});

export function setupParticles(scene) {
    // Cria o InstancedMesh (1 geometria, N cópias)
    mesh = new THREE.InstancedMesh(geometry, material, particleCount);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Avisa que vai mudar todo frame
    scene.add(mesh);

    // Inicializa o array de dados "invisíveis"
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            pos: new THREE.Vector3(0, -100, 0), // Escondido embaixo da terra
            velocity: new THREE.Vector3(0, 0, 0),
            life: 0,
            scale: 0
        });
    }
}

// Função para "nascer" uma fumaça na posição da chaminé
export function spawnSmoke(x, y, z) {
    // Procura uma partícula morta para reciclar
    const particle = particles.find(p => p.life <= 0);
    
    if (particle) {
        particle.life = 1.0; // Vive por "1.0" ciclo
        particle.pos.set(x, y, z);
        // Sobe e vai um pouco para o lado (vento)
        particle.velocity.set(
            (Math.random() - 0.5) * 0.02, 
            Math.random() * 0.03 + 0.02, 
            (Math.random() - 0.5) * 0.02
        );
        particle.scale = Math.random() * 0.5 + 0.5;
    }
}

export function updateParticles() {
    if (!mesh) return;

    let activeCount = 0;

    for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        if (p.life > 0) {
            // Atualiza física
            p.pos.add(p.velocity);
            p.life -= 0.01; // Morre aos poucos
            p.scale += 0.01; // Cresce enquanto sobe (difusão)

            // Atualiza o objeto 3D dummy
            dummy.position.copy(p.pos);
            const currentScale = p.scale * p.life; // Diminui visualmente ao morrer
            dummy.scale.set(currentScale, currentScale, currentScale);
            dummy.rotation.x += p.velocity.x; 
            dummy.rotation.z += p.velocity.z;
            dummy.updateMatrix();

            // Aplica na matriz da instância
            mesh.setMatrixAt(i, dummy.matrix);
            activeCount++;
        } else {
            // Se morreu, joga pro limbo
            dummy.position.set(0, -100, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
    }

    mesh.instanceMatrix.needsUpdate = true;
}