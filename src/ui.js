// src/ui.js

export const kingdomState = [];

let generateCallback = null; 

export function setupKingdomEditor(onGenerate) {
    generateCallback = onGenerate;

    // --- 1. CRIAÇÃO DO PAINEL (JANELA) ---
    const div = document.createElement('div');
    div.id = 'kingdom-editor';
    // MUDANÇA: top: 250px (Para abrir bem abaixo dos botões)
    div.style.cssText = `
        position: absolute; top: 250px; left: 20px; width: 300px; max-height: 50vh;
        background: rgba(0, 0, 0, 0.9); color: white; padding: 15px;
        border-radius: 8px; overflow-y: auto; font-family: sans-serif;
        border: 1px solid #444; display: none; z-index: 2000;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;
    
    div.innerHTML = `
        <h3 style="margin-top:0; color:#FFD700;">🏰 Construtor</h3>
        
        <div id="kingdom-list"></div>
        
        <button id="add-kingdom-btn" style="width:100%; margin-top:10px; padding: 8px; background:#228B22; color:white; border:none; cursor:pointer; border-radius:4px;">+ Reino</button>
        
        <hr style="border-color:#444; margin: 10px 0;">
        
        <button id="apply-btn" style="width:100%; margin-bottom:5px; padding: 10px; background:#4682B4; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:4px;">
            🏗️ Atualizar Vilas
        </button>
        
        <button id="shuffle-btn" style="width:100%; padding: 8px; background:#CD853F; color:white; border:none; cursor:pointer; border-radius:4px; font-size: 0.9em;">
            🎲 Mudar Posições
        </button>

        <button id="close-editor" style="width:100%; margin-top:10px; padding: 5px; background:#333; color:#ccc; border:none; cursor:pointer; border-radius:4px;">Fechar</button>
    `;
    document.body.appendChild(div);

    // --- 2. CRIAÇÃO DO BOTÃO (INTEGRADO AO MENU) ---
    const openBtn = document.createElement('button');
    openBtn.innerText = "🛠️ Editar Reinos";
    openBtn.className = "rpg-btn"; // Usa a mesma classe dos seus outros botões
    openBtn.style.marginTop = "10px"; // Margem para separar do botão de cima
    
    // Tenta achar o container existente
    const controlsContainer = document.getElementById('controls-ui');
    
    if (controlsContainer) {
        // Se achou, adiciona DENTRO dele (solução limpa)
        controlsContainer.appendChild(openBtn);
    } else {
        // Fallback: Se por algum motivo o container não existir, cria no canto
        openBtn.style.position = 'absolute';
        openBtn.style.top = '150px';
        openBtn.style.left = '20px';
        document.body.appendChild(openBtn);
    }
    
    // Ação do Botão
    openBtn.onclick = () => { 
        div.style.display = 'block'; 
        renderKingdoms(); 
    };

    // Eventos do Painel
    div.querySelector('#close-editor').onclick = () => { div.style.display = 'none'; };
    
    div.querySelector('#add-kingdom-btn').onclick = () => {
        kingdomState.push({ name: "Novo Reino", villages: 2, races: { humanos: 100, elfos: 0, anões: 0 } });
        renderKingdoms();
    };

    div.querySelector('#apply-btn').onclick = () => {
        if (generateCallback) generateCallback(kingdomState, false); 
    };

    div.querySelector('#shuffle-btn').onclick = () => {
        if (generateCallback) generateCallback(kingdomState, true); 
    };

    renderKingdoms();
}

function renderKingdoms() {
    const list = document.getElementById('kingdom-list');
    list.innerHTML = '';

    if (kingdomState.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:10px; color:#666; font-size:0.9em;">Mundo vazio.<br>Adicione um reino!</div>';
        return;
    }

    kingdomState.forEach((k, index) => {
        const item = document.createElement('div');
        item.style.cssText = "background: rgba(255,255,255,0.05); padding: 8px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid #FFD700;";
        
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <input type="text" value="${k.name}" data-idx="${index}" class="k-name" style="width: 65%; background:#222; color:white; border:1px solid #555; padding:2px; font-size:0.9em;">
                <button onclick="window.removeKingdom(${index})" style="background:#8B0000; color:white; border:none; cursor:pointer; padding: 0 6px; border-radius:3px;">X</button>
            </div>
            <div style="margin-bottom:5px; font-size:0.9em;">
                <label>Vilas:</label> 
                <input type="number" min="0" max="20" value="${k.villages}" data-idx="${index}" class="k-villages" style="width:40px; background:#222; color:white; border:none; padding:2px;">
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:4px; border-radius:4px; font-size: 0.8em;">
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span>👨 Hum:</span> <input type="number" value="${k.races.humanos || 0}" class="race-in" data-idx="${index}" data-race="humanos" style="width:30px; background:#333; color:white; border:none; text-align:center;">%
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                    <span>🧝 Elf:</span> <input type="number" value="${k.races.elfos || 0}" class="race-in" data-idx="${index}" data-race="elfos" style="width:30px; background:#333; color:white; border:none; text-align:center;">%
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>🛡️ Anão:</span> <input type="number" value="${k.races.anões || 0}" class="race-in" data-idx="${index}" data-race="anões" style="width:30px; background:#333; color:white; border:none; text-align:center;">%
                </div>
            </div>
        `;
        list.appendChild(item);
    });

    document.querySelectorAll('.k-name').forEach(el => el.onchange = (e) => kingdomState[e.target.dataset.idx].name = e.target.value);
    document.querySelectorAll('.k-villages').forEach(el => el.onchange = (e) => kingdomState[e.target.dataset.idx].villages = parseInt(e.target.value));
    document.querySelectorAll('.race-in').forEach(el => el.onchange = (e) => {
        const k = kingdomState[e.target.dataset.idx];
        k.races[e.target.dataset.race] = parseInt(e.target.value);
    });
}

window.removeKingdom = (index) => {
    kingdomState.splice(index, 1);
    renderKingdoms();
};