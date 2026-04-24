class MysteryGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Audio
        this.bgMusic = document.getElementById('bgMusic');
        this.successSound = document.getElementById('successSound');
        
        // Estado del juego
        this.player = { x: 100, y: 100, width: 32, height: 32, speed: 2 };
        this.camera = { x: 0, y: 0 };
        this.inventory = [];
        this.progress = 0;
        this.currentRoom = 'hall';
        this.showDialogue = false;
        this.dialogueText = '';
        this.dialogueOptions = [];
        this.puzzles = {
            safe: { solved: false, code: '2519' },
            piano: { solved: false, notes: ['C', 'E', 'G', 'C'] },
            bookshelf: { solved: false }
        };
        
        this.init();
    }
    
    init() {
        this.loadAssets();
        this.bindEvents();
        this.playMusic();
        this.gameLoop();
    }
    
    loadAssets() {
        // Sprites pixel art (puedes usar imágenes o dibujar programáticamente)
        this.assets = {
            background: this.createPattern('#2c1810', '#4a2c1a'),
            character: this.createCharacterSprite(),
            npc: this.createNpcSprite(),
            door: this.createDoorSprite(),
            key: this.createKeySprite(),
            puzzle1: this.createPuzzleSprite()
        };
    }
    
    createPattern(color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = color2;
        for(let i = 0; i < 64; i += 8) {
            ctx.fillRect(i, 0, 4, 64);
            ctx.fillRect(0, i, 64, 4);
        }
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createCharacterSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        // Cabeza
        ctx.fillStyle = '#f4e4bc';
        ctx.fillRect(8, 4, 16, 12);
        // Ojos
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 8, 2, 2);
        ctx.fillRect(20, 8, 2, 2);
        // Cuerpo
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(6, 16, 20, 12);
        // Pantalones
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(8, 22, 16, 8);
        // Sombrero
        ctx.fillStyle = '#654321';
        ctx.fillRect(4, 0, 24, 6);
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createNpcSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(8, 6, 16, 10);
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(6, 16, 20, 12);
        ctx.fillStyle = '#000080';
        ctx.fillRect(8, 24, 16, 6);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(12, 10, 2, 2);
        ctx.fillRect(18, 10, 2, 2);
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createDoorSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 48, 64);
        ctx.fillStyle = '#654321';
        ctx.fillRect(4, 8, 40, 48);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(20, 30, 8, 8);
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createKeySprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(8, 4, 8, 12);
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(6, 2, 12, 4);
        ctx.fillRect(10, 14, 4, 8);
        return ctx.createPattern(canvas, 'repeat');
    }
    
    createPuzzleSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#666';
        ctx.fillRect(4, 4, 56, 56);
        ctx.fillStyle = '#FFD700';
        for(let i = 0; i < 4; i++) {
            ctx.fillRect(12 + i*14, 20, 10, 10);
        }
        return ctx.createPattern(canvas, 'repeat');
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('keydown', (e) => this.handleKey(e));
        
        // Controles WASD
        document.addEventListener('keydown', (e) => {
            if (this.showDialogue) return;
            
            switch(e.key.toLowerCase()) {
                case 'w': this.player.y -= this.player.speed; break;
                case 's': this.player.y += this.player.speed; break;
                case 'a': this.player.x -= this.player.speed; break;
                case 'd': this.player.x += this.player.speed; break;
            }
        });
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Click en opciones de diálogo
        const options = document.querySelectorAll('.dialogue-option');
        options.forEach((option, index) => {
            const optionRect = option.getBoundingClientRect();
            if (e.clientX >= optionRect.left && e.clientX <= optionRect.right &&
                e.clientY >= optionRect.top && e.clientY <= optionRect.bottom) {
                this.selectOption(index);
            }
        });
    }
    
    handleKey(e) {
        if (e.key === 'Enter' && this.showDialogue) {
            this.nextDialogue();
        }
    }
    
    playMusic() {
        this.bgMusic.volume = 0.3;
        this.bgMusic.play().catch(() => {});
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Cámara sigue al jugador
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // Colisiones con bordes
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
        
        // Verificar interacciones
        this.checkInteractions();
    }
    
    checkInteractions() {
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        // NPC en el salón
        if (this.currentRoom === 'hall' && 
            Math.abs(playerCenterX - 200) < 50 && 
            Math.abs(playerCenterY - 150) < 50) {
            this.showDialogueBox(
                "¡Ayuda! Mi familia desapareció. Encuentra 3 pistas en la mansión.",
                [
                    { text: "Te ayudaré", action: () => this.updateHint("Busca la llave en el piano") }
                ]
            );
        }
        
        // Piano puzzle
        if (this.currentRoom === 'musicRoom' && 
            Math.abs(playerCenterX - 400) < 60 && 
            Math.abs(playerCenterY - 300) < 60 &&
            !this.puzzles.piano.solved) {
            this.showPianoPuzzle();
        }
        
        // Llave recogida
        if (!this.inventory.includes('key') && 
            this.currentRoom === 'musicRoom' &&
            Math.abs(playerCenterX - 450) < 30 && 
            Math.abs(playerCenterY - 350) < 30) {
            this.pickupItem('key');
            this.updateHint("Usa la llave en la puerta del estudio");
        }
    }
    
    showDialogueBox(text, options) {
        this.showDialogue = true;
        this.dialogueText = text;
        this.dialogueOptions = options;
        this.updateUI();
    }
    
    showPianoPuzzle() {
        this.showDialogueBox(
            "Toca las notas correctas del piano (C E G C)",
            [
                { text: "C E G C", action: () => {
                    this.puzzles.piano.solved = true;
                    this.progress++;
                    this.successSound.play();
                    this.updateProgress();
                    this.updateHint("¡Llave obtenida! Está debajo del piano");
                    this.closeDialogue();
                }},
                { text: "Probar otra combinación", action: () => {
                    this.closeDialogue();
                }}
            ]
        );
    }
    
    pickupItem(item) {
        this.inventory.push(item);
        this.updateInventoryUI();
    }
    
    selectOption(index) {
        if (this.dialogueOptions[index]) {
            this.dialogueOptions[index].action();
        }
    }
    
    nextDialogue() {
        this.closeDialogue();
    }
    
    closeDialogue() {
        this.showDialogue = false;
        this.dialogueText = '';
        this.dialogueOptions = [];
        this.updateUI();
    }
    
    updateHint(text) {
        document.getElementById('hint').textContent = text;
    }
    
    updateProgress() {
        document.getElementById('progress').textContent = `${this.progress}/5`;
        if (this.progress >= 5) {
            this.showDialogueBox(
                "¡FELICIDADES! Resolviste el misterio. La familia está a salvo.",
                [{ text: "¡Victoria!", action: () => {
                    this.closeDialogue();
                    alert("🎉 ¡Ganaste el juego! 🎉");
                }}]
            );
        }
    }
    
    updateInventoryUI() {
        const container = document.getElementById('inventoryItems');
        container.innerHTML = '';
        this.inventory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.title = item;
            div.style.backgroundImage = `url(data:image/svg+xml;base64,${btoa(this.assets.key ? 'pattern' : '')})`;
            container.appendChild(div);
        });
    }
    
    updateUI() {
        document.getElementById('dialogueText').textContent = this.dialogueText;
        const optionsContainer = document.getElementById('dialogueOptions');
        optionsContainer.innerHTML = '';
        
        this.dialogueOptions.forEach(option => {
            const btn = document.createElement('div');
            btn.className = 'dialogue-option';
            btn.textContent = option.text;
            optionsContainer.appendChild(btn);
        });
        
        this.updateInventoryUI();
    }
    
    render() {
        // Limpiar canvas
        this.ctx.fillStyle = '#1a0f0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fondo con patrón
        this.ctx.fillStyle = this.assets.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Jugador
        this.ctx.save();
        this.ctx.translate(this.player.x - this.camera.x, this.player.y - this.camera.y);
        this.ctx.fillStyle = this.assets.character;
        this.ctx.fillRect(0, 0, this.player.width, this.player
        this.ctx.fillRect(0, 0, this.player.width, this.player.height);
        this.ctx.restore();
        
        // NPC (solo en salón)
        if (this.currentRoom === 'hall') {
            this.ctx.save();
            this.ctx.translate(200 - this.camera.x, 150 - this.camera.y);
            this.ctx.fillStyle = this.assets.npc;
            this.ctx.fillRect(0, 0, 32, 32);
            this.ctx.restore();
        }
        
        // Piano puzzle (sala de música)
        if (this.currentRoom === 'musicRoom') {
            this.ctx.save();
            this.ctx.translate(400 - this.camera.x, 300 - this.camera.y);
            this.ctx.fillStyle = this.assets.puzzle1;
            this.ctx.fillRect(0, 0, 64, 64);
            
            // Llave debajo del piano
            if (!this.inventory.includes('key')) {
                this.ctx.translate(50, 50);
                this.ctx.fillStyle = this.assets.key;
                this.ctx.fillRect(0, 0, 24, 24);
            }
            this.ctx.restore();
        }
        
        // Puerta al estudio (requiere llave)
        this.ctx.save();
        this.ctx.translate(600 - this.camera.x, 200 - this.camera.y);
        this.ctx.fillStyle = this.assets.door;
        this.ctx.fillRect(0, 0, 48, 64);
        this.ctx.restore();
        
        // Efectos de partículas (polvo flotante)
        this.renderParticles();
        
        // Interfaz de diálogo
        if (this.showDialogue) {
            this.renderDialogueBox();
        }
    }
    
    renderParticles() {
        for (let i = 0; i < 20; i++) {
            const x = (Date.now() * 0.01 + i * 100) % this.canvas.width;
            const y = Math.sin(Date.now() * 0.005 + i) * 20 + 100;
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#f4e4bc';
            this.ctx.fillRect(x - this.camera.x, y - this.camera.y, 2, 2);
            this.ctx.restore();
        }
    }
    
    renderDialogueBox() {
        // Dibujar fondo del diálogo en canvas también
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(50, this.canvas.height - 150, this.canvas.width - 100, 120);
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(50, this.canvas.height - 150, this.canvas.width - 100, 120);
    }
}

// Inicializar juego cuando carga la página
window.addEventListener('load', () => {
    new MysteryGame();
});
