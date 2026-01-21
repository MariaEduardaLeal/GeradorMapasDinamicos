Um gerador de mapas 3D procedural para campanhas de RPG, criado com **Three.js** e **Simplex Noise**. Este projeto gera terrenos, oceanos, cidades e sistemas climáticos únicos a cada execução, com um estilo visual "Low Poly".

_(Substitua este link por um print do seu mapa depois)_

##  Funcionalidades

- **Geração Procedural:** Terrenos infinitamente variados usando algoritmos de ruído (Simplex Noise).
    
- **Água Dinâmica (Low Poly):** Mar com estilo geométrico que reage fisicamente. Áreas de "tempestade" aleatórias criam ondas gigantes localizadas.
    
- **Ciclo Dia/Noite:** Sistema completo de 10 minutos com sol e lua orbitais, mudança de cor do céu, neblina e iluminação dinâmica.
    
- **Clima:** Nuvens flutuantes que projetam sombras no chão e se movem com o vento.
    
- **Cidades Interativas:** Geração de cidades em locais habitáveis. Clique nas cidades para ver Nome, População e Tipo (Vila, Forte, etc).
    
- **Save & Load:** Exporte o "DNA" do seu mundo (Seeds) para um arquivo JSON e carregue-o novamente para continuar de onde parou.
    
- **Sombras Realistas:** Montanhas e nuvens projetam sombras dinâmicas que se alongam durante o amanhecer/entardecer.
    

##  Tecnologias Utilizadas

- **JavaScript (ES6 Modules)**
    
- **Three.js** (Renderização 3D)
    
- **Simplex-Noise** (Matemática para geração de terreno)
    
- **HTML5 & CSS3**


## Como Rodar o Projeto

Como este projeto utiliza **ES Modules** (`import ... from ...`), você **não pode** apenas clicar duas vezes no `index.html`. O navegador bloqueará o código por segurança (política de CORS). Você precisa de um servidor local simples.

### Opção 1: VS Code (Recomendado)

1. Instale a extensão **Live Server** no VS Code.
    
2. Abra a pasta do projeto no VS Code.
    
3. Clique com o botão direito no `index.html` e escolha **"Open with Live Server"**.
    

### Opção 2: Python

Se você tem Python instalado, abra o terminal na pasta do projeto e rode:

Bash

```
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Acesse `http://localhost:8000` no navegador.

### Opção 3: Node.js

Se tem Node.js instalado:

Bash

```
npx http-server .
```

##  Estrutura do Projeto

O código foi modularizado para facilitar a manutenção:

```
/
├── index.html        # Estrutura base e Interface de Usuário (UI)
├── style.css         # Estilização da UI
├── README.md         # Documentação
│
└── src/              # Código Fonte JavaScript
    ├── main.js       # Loop principal, setup da cena e eventos
    ├── terrain.js    # Geração da malha do terreno e biomas
    ├── water.js      # Geração da água e lógica das ondas físicas
    ├── sky.js        # Sol, Lua, Nuvens e iluminação
    ├── cities.js     # Posicionamento e dados das cidades
    └── utils.js      # Configurações globais e instância do Noise
```

##  Controles

|**Ação**|**Comando**|
|---|---|
|**Girar Câmera**|Clique Esquerdo + Arrastar|
|**Zoom**|Scroll do Mouse (Roda)|
|**Ver Info Cidade**|Clique Esquerdo sobre a cidade (cilindro vermelho)|
|**Salvar Mapa**|Botão "Salvar" (Baixa um .json)|
|**Carregar Mapa**|Botão "Carregar" (Selecione o .json)|
|**Novo Mundo**|Botão "Novo Mundo"|

##  Futuras Melhorias (Ideias)
    
- [ ] Adicionar monstros ou barcos que se movem.
    
- [ ] Modo de "Câmera em Primeira Pessoa" para andar no mapa.
    

##  Licença

Este projeto é de código aberto. Sinta-se livre para usar, modificar e aprender com ele!
