/**
 * FusionBots Arena
 * MVP - Juego competitivo 2D arcade para 2 jugadores locales
 * Fusiones deportivas híbridas con cambio automático de modos cada 60 segundos
 */

// =============================================================================
// CONFIGURACIÓN DEL JUEGO
// =============================================================================

const GAME_CONFIG = {
    width: 1024,
    height: 768,
    playerSpeed: 250,
    pushForce: 500,
    pushCooldown: 800, // 800ms como especificado
    modeDuration: 60000, // 60 segundos
    transitionDuration: 2000, // 2 segundos de transición
    pauseBeforeChange: 1000, // 1 segundo de pausa antes de cambiar
    ballDrag: 0.98,
    playerRadius: 25,
    ballRadius: 15,
    arenaMargin: 50,
    goalWidth: 100,
    safeZoneRadius: 180,
    totalGameDuration: 420000 // 7 minutos total (6 modos + fusión total)
};

// Colores del juego
const COLORS = {
    player1: 0x3498db, // Azul
    player2: 0xe74c3c, // Rojo
    ball: 0xffffff,    // Blanco
    arena: 0x2c3e50,   // Gris oscuro
    goal1: 0x2980b9,   // Azul oscuro
    goal2: 0xc0392b,   // Rojo oscuro
    safeZone: 0x27ae60, // Verde
    lava: 0xe74c3c,    // Rojo (lava)
    dangerZone: 0xe74c3c, // Rojo
    ui: 0xecf0f1,      // Blanco humo
    zoneControl: 0xf39c12, // Amarillo/naranja para zona de control
    basket: 0x9b59b6   // Púrpura para canasta
};

// =============================================================================
// CLASE PLAYER
// =============================================================================

class Player {
    constructor(scene, x, y, color, controls, playerNumber) {
        this.scene = scene;
        this.playerNumber = playerNumber;
        this.controls = controls;
        this.color = color;
        this.pushCooldown = 0;
        this.score = 0;
        this.possessionTime = 0;
        this.inSafeZone = true;
        
        // Crear sprite del jugador como círculo
        this.sprite = scene.add.circle(x, y, GAME_CONFIG.playerRadius, color);
        scene.physics.add.existing(this.sprite);
        
        // Configurar física
        this.sprite.body.setCircle(GAME_CONFIG.playerRadius);
        this.sprite.body.setBounce(0.5);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setDrag(100);
        this.sprite.body.setMaxVelocity(GAME_CONFIG.playerSpeed * 1.5);
        
        // Indicador de número de jugador
        this.label = scene.add.text(x, y, playerNumber.toString(), {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Indicador de cooldown de empuje
        this.cooldownIndicator = scene.add.circle(x, y - 35, 5, 0x00ff00);
    }
    
    update(delta) {
        // Actualizar cooldown
        if (this.pushCooldown > 0) {
            this.pushCooldown -= delta;
            this.cooldownIndicator.setFillStyle(0xff0000);
        } else {
            this.cooldownIndicator.setFillStyle(0x00ff00);
        }
        
        // Movimiento
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.controls.up.isDown) velocityY = -GAME_CONFIG.playerSpeed;
        if (this.controls.down.isDown) velocityY = GAME_CONFIG.playerSpeed;
        if (this.controls.left.isDown) velocityX = -GAME_CONFIG.playerSpeed;
        if (this.controls.right.isDown) velocityX = GAME_CONFIG.playerSpeed;
        
        // Normalizar diagonal
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.sprite.body.setVelocity(velocityX, velocityY);
        
        // Actualizar posición de label e indicador
        this.label.setPosition(this.sprite.x, this.sprite.y);
        this.cooldownIndicator.setPosition(this.sprite.x, this.sprite.y - 35);
    }
    
    canPush() {
        return this.pushCooldown <= 0;
    }
    
    doPush() {
        if (this.canPush()) {
            this.pushCooldown = GAME_CONFIG.pushCooldown;
            return true;
        }
        return false;
    }
    
    reset(x, y) {
        this.sprite.setPosition(x, y);
        this.sprite.body.setVelocity(0, 0);
        this.pushCooldown = 0;
    }
    
    addScore(points) {
        this.score += points;
    }
    
    resetScore() {
        this.score = 0;
    }
    
    destroy() {
        this.sprite.destroy();
        this.label.destroy();
        this.cooldownIndicator.destroy();
    }
}

// =============================================================================
// CLASE BALL
// =============================================================================

class Ball {
    constructor(scene, x, y) {
        this.scene = scene;
        this.initialX = x;
        this.initialY = y;
        
        // Crear sprite del balón
        this.sprite = scene.add.circle(x, y, GAME_CONFIG.ballRadius, COLORS.ball);
        scene.physics.add.existing(this.sprite);
        
        // Configurar física
        this.sprite.body.setCircle(GAME_CONFIG.ballRadius);
        this.sprite.body.setBounce(0.8);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setDrag(50);
        this.sprite.body.setMaxVelocity(600);
        
        // Borde del balón
        this.border = scene.add.circle(x, y, GAME_CONFIG.ballRadius + 2);
        this.border.setStrokeStyle(3, 0x000000);
    }
    
    update() {
        // Aplicar fricción personalizada
        this.sprite.body.velocity.x *= GAME_CONFIG.ballDrag;
        this.sprite.body.velocity.y *= GAME_CONFIG.ballDrag;
        
        // Actualizar borde
        this.border.setPosition(this.sprite.x, this.sprite.y);
    }
    
    reset() {
        this.sprite.setPosition(this.initialX, this.initialY);
        this.sprite.body.setVelocity(0, 0);
    }
    
    applyForce(forceX, forceY) {
        this.sprite.body.velocity.x += forceX;
        this.sprite.body.velocity.y += forceY;
    }
    
    setVisible(visible) {
        this.sprite.setVisible(visible);
        this.border.setVisible(visible);
    }
    
    destroy() {
        this.sprite.destroy();
        this.border.destroy();
    }
}

// =============================================================================
// CLASE BASE GAMEMODE (Abstracta)
// =============================================================================

class GameMode {
    constructor(scene, name, description) {
        this.scene = scene;
        this.name = name;
        this.description = description;
        this.isActive = false;
        this.winner = null;
    }
    
    // Métodos a implementar en subclases
    start() {
        this.isActive = true;
        this.winner = null;
    }
    
    update(delta) {
        // Override en subclases
    }
    
    end() {
        this.isActive = false;
        this.checkWinCondition();
    }
    
    checkWinCondition() {
        // Override en subclases
    }
    
    reset() {
        // Override en subclases
    }
    
    getWinner() {
        return this.winner;
    }
    
    // Métodos helper
    getPlayers() {
        return [this.scene.player1, this.scene.player2];
    }
    
    getBall() {
        return this.scene.ball;
    }
    
    destroy() {
        // Override para limpiar elementos específicos del modo
    }
}

// =============================================================================
// CLASE HYBRIDMODE (Extiende GameMode) - Base para modos híbridos
// =============================================================================

class HybridMode extends GameMode {
    constructor(scene, name, description, sport1, sport2) {
        super(scene, name, description);
        this.sport1 = sport1; // Primer deporte de la fusión
        this.sport2 = sport2; // Segundo deporte de la fusión
        this.arenaElements = []; // Elementos visuales del arena
    }
    
    // Configurar arena específica del modo
    setupArena() {
        // Override en subclases
    }
    
    // Configurar posiciones de jugadores
    setupPlayers() {
        this.scene.player1.reset(200, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width - 200, GAME_CONFIG.height / 2);
    }
    
    // Configurar el balón
    setupBall() {
        this.scene.ball.setVisible(true);
        this.scene.ball.reset();
    }
    
    // Lógica de actualización del modo
    updateModeLogic(delta) {
        // Override en subclases
    }
    
    // Verificar condición de victoria
    checkWinCondition() {
        if (this.scene.player1.score > this.scene.player2.score) {
            this.winner = 1;
        } else if (this.scene.player2.score > this.scene.player1.score) {
            this.winner = 2;
        } else {
            this.winner = 0; // Empate
        }
    }
    
    // Limpiar elementos del modo
    cleanup() {
        this.arenaElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.arenaElements = [];
    }
    
    start() {
        super.start();
        this.scene.player1.resetScore();
        this.scene.player2.resetScore();
        this.setupArena();
        this.setupPlayers();
        this.setupBall();
    }
    
    update(delta) {
        this.updateModeLogic(delta);
    }
    
    destroy() {
        this.cleanup();
    }
}

// =============================================================================
// MODO HÍBRIDO 1: FÚTBOL + SUMO (Gol de Supervivencia)
// =============================================================================

class SurvivalGoalMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "GOL DE SUPERVIVENCIA", 
            "¡Anota o empuja fuera! Goles que se anulan si caes",
            "Fútbol",
            "Sumo"
        );
        this.goals = [];
        this.lastGoalScorer = null;
        this.lastGoalTime = 0;
        this.goalCancelWindow = 3000; // 3 segundos para anular gol
        this.pendingGoal = null;
    }
    
    setupArena() {
        // Crear porterías
        const goalHeight = GAME_CONFIG.goalWidth;
        const goalWidth = 20;
        const centerY = GAME_CONFIG.height / 2;
        
        // Portería izquierda (jugador 2 anota aquí)
        this.goal1 = this.scene.add.rectangle(
            goalWidth / 2, centerY, 
            goalWidth, goalHeight, 
            COLORS.goal1
        );
        this.scene.physics.add.existing(this.goal1, true);
        this.arenaElements.push(this.goal1);
        
        // Portería derecha (jugador 1 anota aquí)
        this.goal2 = this.scene.add.rectangle(
            GAME_CONFIG.width - goalWidth / 2, centerY, 
            goalWidth, goalHeight, 
            COLORS.goal2
        );
        this.scene.physics.add.existing(this.goal2, true);
        this.arenaElements.push(this.goal2);
        
        this.goals = [this.goal1, this.goal2];
        
        // Indicadores visuales de zona de caída (sin paredes laterales)
        const warningZone = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, 30, 
            GAME_CONFIG.width, 60, 
            COLORS.lava, 0.3
        );
        this.arenaElements.push(warningZone);
        
        const warningZone2 = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height - 30, 
            GAME_CONFIG.width, 60, 
            COLORS.lava, 0.3
        );
        this.arenaElements.push(warningZone2);
        
        // Detectar goles
        this.goalOverlap1 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal1, () => {
                if (this.isActive) this.scoreGoal(2);
            }
        );
        
        this.goalOverlap2 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal2, () => {
                if (this.isActive) this.scoreGoal(1);
            }
        );
        
        // Desactivar colisión con bordes superior/inferior
        this.scene.player1.sprite.body.setCollideWorldBounds(false);
        this.scene.player2.sprite.body.setCollideWorldBounds(false);
    }
    
    scoreGoal(playerNumber) {
        if (this.pendingGoal) return; // Ya hay un gol pendiente
        
        this.pendingGoal = {
            player: playerNumber,
            time: Date.now()
        };
        
        this.scene.uiManager.showMessage(`¡GOL PENDIENTE J${playerNumber}! No caigas...`, 1500);
        
        // Resetear balón
        this.scene.ball.reset();
    }
    
    updateModeLogic(delta) {
        // Verificar si jugadores caen fuera del mapa (arriba/abajo)
        const margin = 30;
        
        [this.scene.player1, this.scene.player2].forEach((player, index) => {
            const playerNum = index + 1;
            const sprite = player.sprite;
            
            if (sprite.y < margin || sprite.y > GAME_CONFIG.height - margin) {
                const otherPlayer = playerNum === 1 ? this.scene.player2 : this.scene.player1;
                const otherPlayerNum = playerNum === 1 ? 2 : 1;
                
                // Si hay un gol pendiente y el que anota cae, se anula
                if (this.pendingGoal && this.pendingGoal.player === playerNum) {
                    this.scene.uiManager.showMessage(`¡GOL ANULADO! J${playerNum} cayó`, 1500);
                    this.pendingGoal = null;
                } else {
                    // El otro jugador gana punto por empujar fuera
                    otherPlayer.addScore(1);
                    this.scene.uiManager.showMessage(`¡ELIMINADO! +1 J${otherPlayerNum}`, 1000);
                }
                
                // Resetear posiciones
                this.resetPositions();
            }
        });
        
        // Confirmar gol pendiente después de 3 segundos
        if (this.pendingGoal && Date.now() - this.pendingGoal.time >= this.goalCancelWindow) {
            const player = this.pendingGoal.player === 1 ? this.scene.player1 : this.scene.player2;
            player.addScore(1);
            this.scene.uiManager.showMessage(`¡GOL CONFIRMADO! +1 J${this.pendingGoal.player}`, 1000);
            this.pendingGoal = null;
            this.resetPositions();
        }
    }
    
    resetPositions() {
        this.scene.player1.reset(200, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width - 200, GAME_CONFIG.height / 2);
        this.scene.ball.reset();
    }
    
    cleanup() {
        super.cleanup();
        // Restaurar colisión con bordes
        if (this.scene.player1) {
            this.scene.player1.sprite.body.setCollideWorldBounds(true);
        }
        if (this.scene.player2) {
            this.scene.player2.sprite.body.setCollideWorldBounds(true);
        }
        // Limpiar overlaps
        if (this.goalOverlap1) this.goalOverlap1.destroy();
        if (this.goalOverlap2) this.goalOverlap2.destroy();
        this.pendingGoal = null;
    }
}

// =============================================================================
// MODO HÍBRIDO 2: RUGBY + ZONA DE CONTROL (Carry Dominance)
// =============================================================================

class CarryDominanceMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "CARRY DOMINANCE", 
            "Cruza línea rival con balón +2 | Zona central +1 cada 3s",
            "Rugby",
            "Zona de Control"
        );
        this.controlZone = null;
        this.ballCarrier = null;
        this.zoneTimer = 0;
        this.zonePointInterval = 3000; // 3 segundos
        this.tryLines = [];
        this.carrierSlowdown = 0.7; // 70% de velocidad con balón
    }
    
    setupArena() {
        // Líneas de try (sin porterías)
        const lineWidth = 10;
        
        // Línea izquierda (J1 debe cruzar aquí)
        const tryLine1 = this.scene.add.rectangle(
            GAME_CONFIG.arenaMargin, GAME_CONFIG.height / 2,
            lineWidth, GAME_CONFIG.height - GAME_CONFIG.arenaMargin * 2,
            COLORS.goal2, 0.5
        );
        this.arenaElements.push(tryLine1);
        this.tryLines.push({ line: tryLine1, forPlayer: 1 });
        
        // Línea derecha (J2 debe cruzar aquí)
        const tryLine2 = this.scene.add.rectangle(
            GAME_CONFIG.width - GAME_CONFIG.arenaMargin, GAME_CONFIG.height / 2,
            lineWidth, GAME_CONFIG.height - GAME_CONFIG.arenaMargin * 2,
            COLORS.goal1, 0.5
        );
        this.arenaElements.push(tryLine2);
        this.tryLines.push({ line: tryLine2, forPlayer: 2 });
        
        // Zona de control central
        this.controlZone = this.scene.add.circle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            100, COLORS.zoneControl, 0.3
        );
        this.controlZone.setStrokeStyle(3, COLORS.zoneControl);
        this.arenaElements.push(this.controlZone);
        
        // Texto de zona
        this.zoneText = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2 - 120,
            'ZONA +1', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#f39c12'
            }
        ).setOrigin(0.5);
        this.arenaElements.push(this.zoneText);
    }
    
    setupBall() {
        super.setupBall();
        this.ballCarrier = null;
    }
    
    updateModeLogic(delta) {
        const ball = this.scene.ball.sprite;
        const p1 = this.scene.player1.sprite;
        const p2 = this.scene.player2.sprite;
        
        // Determinar portador del balón
        const dist1 = Phaser.Math.Distance.Between(ball.x, ball.y, p1.x, p1.y);
        const dist2 = Phaser.Math.Distance.Between(ball.x, ball.y, p2.x, p2.y);
        const carryDistance = GAME_CONFIG.playerRadius + GAME_CONFIG.ballRadius + 10;
        
        const prevCarrier = this.ballCarrier;
        
        if (dist1 < carryDistance && dist1 < dist2) {
            this.ballCarrier = 1;
            // Hacer que el balón siga al jugador
            ball.setPosition(p1.x, p1.y);
            ball.body.setVelocity(0, 0);
        } else if (dist2 < carryDistance && dist2 < dist1) {
            this.ballCarrier = 2;
            ball.setPosition(p2.x, p2.y);
            ball.body.setVelocity(0, 0);
        } else {
            this.ballCarrier = null;
        }
        
        // Aplicar ralentización al portador
        if (this.ballCarrier === 1) {
            this.scene.player1.sprite.body.velocity.x *= this.carrierSlowdown;
            this.scene.player1.sprite.body.velocity.y *= this.carrierSlowdown;
        } else if (this.ballCarrier === 2) {
            this.scene.player2.sprite.body.velocity.x *= this.carrierSlowdown;
            this.scene.player2.sprite.body.velocity.y *= this.carrierSlowdown;
        }
        
        // Verificar try (cruzar línea con balón)
        if (this.ballCarrier === 1 && p1.x >= GAME_CONFIG.width - GAME_CONFIG.arenaMargin - 20) {
            this.scene.player1.addScore(2);
            this.scene.uiManager.showMessage('¡TRY! +2 J1', 1000);
            this.resetPositions();
        }
        if (this.ballCarrier === 2 && p2.x <= GAME_CONFIG.arenaMargin + 20) {
            this.scene.player2.addScore(2);
            this.scene.uiManager.showMessage('¡TRY! +2 J2', 1000);
            this.resetPositions();
        }
        
        // Zona de control - puntos por permanecer
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        const zoneRadius = 100;
        
        const p1InZone = Phaser.Math.Distance.Between(p1.x, p1.y, centerX, centerY) < zoneRadius;
        const p2InZone = Phaser.Math.Distance.Between(p2.x, p2.y, centerX, centerY) < zoneRadius;
        
        this.zoneTimer += delta;
        
        if (this.zoneTimer >= this.zonePointInterval) {
            this.zoneTimer = 0;
            
            if (p1InZone && !p2InZone) {
                this.scene.player1.addScore(1);
                this.scene.uiManager.showMessage('ZONA +1 J1', 500);
            } else if (p2InZone && !p1InZone) {
                this.scene.player2.addScore(1);
                this.scene.uiManager.showMessage('ZONA +1 J2', 500);
            }
        }
    }
    
    resetPositions() {
        this.setupPlayers();
        this.scene.ball.reset();
        this.ballCarrier = null;
    }
}

// =============================================================================
// MODO HÍBRIDO 3: BALONCESTO + LAVA PROGRESIVA (Triple Riesgo)
// =============================================================================

class TripleRiskMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "TRIPLE RIESGO", 
            "Canasta central | Lava = +3 pero reduce puntos",
            "Baloncesto",
            "Lava Progresiva"
        );
        this.basket = null;
        this.lavaZone = null;
        this.safeZone = null;
        this.initialSafeRadius = 280;
        this.currentSafeRadius = 280;
        this.minSafeRadius = 80;
        this.shrinkRate = 3; // Píxeles por segundo
        this.lavaDamageRate = 2; // Puntos perdidos por segundo en lava
        this.basketRadius = 40;
    }
    
    setupArena() {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        
        this.currentSafeRadius = this.initialSafeRadius;
        
        // Zona de lava (fondo rojo)
        this.lavaZone = this.scene.add.rectangle(
            centerX, centerY,
            GAME_CONFIG.width, GAME_CONFIG.height,
            COLORS.lava, 0.25
        );
        this.lavaZone.setDepth(-2);
        this.arenaElements.push(this.lavaZone);
        
        // Zona segura (círculo verde que se reduce)
        this.safeZone = this.scene.add.circle(
            centerX, centerY,
            this.currentSafeRadius,
            COLORS.safeZone, 0.3
        );
        this.safeZone.setStrokeStyle(4, COLORS.safeZone);
        this.safeZone.setDepth(-1);
        this.arenaElements.push(this.safeZone);
        
        // Canasta central (zona pequeña)
        this.basket = this.scene.add.circle(
            centerX, centerY,
            this.basketRadius,
            COLORS.basket, 0.5
        );
        this.basket.setStrokeStyle(4, 0xffffff);
        this.arenaElements.push(this.basket);
        
        // Texto de canasta
        this.basketText = this.scene.add.text(
            centerX, centerY - 60,
            'CANASTA', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#9b59b6'
            }
        ).setOrigin(0.5);
        this.arenaElements.push(this.basketText);
        
        // Dar puntos iniciales para supervivencia
        this.scene.player1.score = 50;
        this.scene.player2.score = 50;
    }
    
    updateModeLogic(delta) {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        const ball = this.scene.ball.sprite;
        
        // Reducir zona segura progresivamente
        if (this.currentSafeRadius > this.minSafeRadius) {
            this.currentSafeRadius -= (this.shrinkRate * delta) / 1000;
            this.safeZone.setRadius(Math.max(this.currentSafeRadius, this.minSafeRadius));
        }
        
        // Verificar si el balón entra en la canasta
        const ballDist = Phaser.Math.Distance.Between(ball.x, ball.y, centerX, centerY);
        if (ballDist < this.basketRadius) {
            // Determinar quién metió el balón (último en tocarlo)
            const dist1 = Phaser.Math.Distance.Between(
                ball.x, ball.y,
                this.scene.player1.sprite.x, this.scene.player1.sprite.y
            );
            const dist2 = Phaser.Math.Distance.Between(
                ball.x, ball.y,
                this.scene.player2.sprite.x, this.scene.player2.sprite.y
            );
            
            // El jugador más cercano es el que "metió" el balón
            let scorer, scorerNum;
            if (dist1 < dist2) {
                scorer = this.scene.player1;
                scorerNum = 1;
            } else {
                scorer = this.scene.player2;
                scorerNum = 2;
            }
            
            // Determinar si está en lava o zona segura
            const scorerDist = Phaser.Math.Distance.Between(
                scorer.sprite.x, scorer.sprite.y, centerX, centerY
            );
            
            if (scorerDist > this.currentSafeRadius) {
                // En lava = +3 puntos
                scorer.addScore(3);
                this.scene.uiManager.showMessage(`¡TRIPLE! +3 J${scorerNum}`, 1000);
            } else {
                // En zona segura = +1 punto
                scorer.addScore(1);
                this.scene.uiManager.showMessage(`¡CANASTA! +1 J${scorerNum}`, 1000);
            }
            
            this.scene.ball.reset();
        }
        
        // Daño por lava a jugadores
        [this.scene.player1, this.scene.player2].forEach(player => {
            const playerDist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y, centerX, centerY
            );
            
            if (playerDist > this.currentSafeRadius) {
                const damage = (this.lavaDamageRate * delta) / 1000;
                player.score = Math.max(0, player.score - damage);
            }
        });
    }
}

// =============================================================================
// MODO HÍBRIDO 4: HOCKEY + PORTERÍAS MÓVILES (Objetivo Dinámico)
// =============================================================================

class DynamicGoalMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "OBJETIVO DINÁMICO", 
            "¡Porterías que se mueven! Rebote fuerte del balón",
            "Hockey",
            "Porterías Móviles"
        );
        this.movingGoals = [];
        this.goalSpeed = 50;
        this.goalDirection = [1, -1]; // Dirección de movimiento de cada portería
    }
    
    setupArena() {
        const goalHeight = 80;
        const goalWidth = 25;
        
        // Portería móvil izquierda
        this.goal1 = this.scene.add.rectangle(
            60, GAME_CONFIG.height / 2,
            goalWidth, goalHeight,
            COLORS.goal1
        );
        this.scene.physics.add.existing(this.goal1, false);
        this.goal1.body.setImmovable(true);
        this.goal1.body.setBounce(0);
        this.arenaElements.push(this.goal1);
        
        // Portería móvil derecha
        this.goal2 = this.scene.add.rectangle(
            GAME_CONFIG.width - 60, GAME_CONFIG.height / 2,
            goalWidth, goalHeight,
            COLORS.goal2
        );
        this.scene.physics.add.existing(this.goal2, false);
        this.goal2.body.setImmovable(true);
        this.goal2.body.setBounce(0);
        this.arenaElements.push(this.goal2);
        
        this.movingGoals = [this.goal1, this.goal2];
        
        // Aumentar rebote del balón (hockey)
        this.scene.ball.sprite.body.setBounce(1.2);
        
        // Detectar goles
        this.goalOverlap1 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal1, () => {
                if (this.isActive) this.scoreGoal(2);
            }
        );
        
        this.goalOverlap2 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal2, () => {
                if (this.isActive) this.scoreGoal(1);
            }
        );
    }
    
    setupBall() {
        super.setupBall();
        // Configurar balón de hockey (más rebote)
        this.scene.ball.sprite.body.setBounce(1.2);
        this.scene.ball.sprite.body.setDrag(20); // Menos fricción
    }
    
    scoreGoal(playerNumber) {
        const player = playerNumber === 1 ? this.scene.player1 : this.scene.player2;
        player.addScore(1);
        this.scene.uiManager.showMessage(`¡GOL! +1 J${playerNumber}`, 1000);
        
        // Resetear
        this.scene.ball.reset();
        this.setupPlayers();
    }
    
    updateModeLogic(delta) {
        const margin = 100;
        const maxY = GAME_CONFIG.height - margin;
        const minY = margin;
        
        // Mover porterías
        this.movingGoals.forEach((goal, index) => {
            const newY = goal.y + (this.goalSpeed * this.goalDirection[index] * delta) / 1000;
            
            // Cambiar dirección si llega al límite
            if (newY >= maxY || newY <= minY) {
                this.goalDirection[index] *= -1;
            }
            
            goal.setY(Phaser.Math.Clamp(newY, minY, maxY));
            goal.body.updateFromGameObject();
        });
    }
    
    cleanup() {
        super.cleanup();
        // Restaurar rebote normal del balón
        if (this.scene.ball) {
            this.scene.ball.sprite.body.setBounce(0.8);
            this.scene.ball.sprite.body.setDrag(50);
        }
        if (this.goalOverlap1) this.goalOverlap1.destroy();
        if (this.goalOverlap2) this.goalOverlap2.destroy();
    }
}

// =============================================================================
// MODO HÍBRIDO 5: BOXEO + BALÓN EXPLOSIVO (Impacto Controlado)
// =============================================================================

class ExplosiveBallMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "IMPACTO CONTROLADO", 
            "¡El balón explota! El más cercano pierde puntos",
            "Boxeo",
            "Balón Explosivo"
        );
        this.explosionTimer = 0;
        this.explosionTime = 8000; // 8 segundos
        this.timerText = null;
        this.explosionPenalty = 3;
    }
    
    setupArena() {
        // Arena simple para boxeo
        const ring = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            GAME_CONFIG.width - 100, GAME_CONFIG.height - 100
        );
        ring.setStrokeStyle(6, 0xffffff, 0.5);
        this.arenaElements.push(ring);
        
        // Timer visual del balón
        this.timerText = this.scene.add.text(
            GAME_CONFIG.width / 2, 100,
            '8', {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: '#ff0000',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.timerText.setDepth(50);
        this.arenaElements.push(this.timerText);
        
        // Dar puntos iniciales
        this.scene.player1.score = 20;
        this.scene.player2.score = 20;
    }
    
    setupBall() {
        super.setupBall();
        this.explosionTimer = 0;
        this.scene.ball.sprite.setFillStyle(0xffff00); // Amarillo/naranja para bomba
    }
    
    updateModeLogic(delta) {
        // Actualizar timer de explosión
        this.explosionTimer += delta;
        const timeLeft = Math.ceil((this.explosionTime - this.explosionTimer) / 1000);
        
        // Actualizar texto del timer
        if (this.timerText) {
            this.timerText.setText(Math.max(0, timeLeft).toString());
            
            // Cambiar color según tiempo
            if (timeLeft <= 2) {
                this.timerText.setColor('#ff0000');
                this.scene.ball.sprite.setFillStyle(0xff0000); // Rojo cuando va a explotar
            } else if (timeLeft <= 4) {
                this.timerText.setColor('#ff8800');
                this.scene.ball.sprite.setFillStyle(0xff8800); // Naranja
            } else {
                this.timerText.setColor('#ffff00');
                this.scene.ball.sprite.setFillStyle(0xffff00); // Amarillo
            }
        }
        
        // Explosión
        if (this.explosionTimer >= this.explosionTime) {
            this.explodeBall();
        }
    }
    
    explodeBall() {
        const ball = this.scene.ball.sprite;
        const p1 = this.scene.player1.sprite;
        const p2 = this.scene.player2.sprite;
        
        const dist1 = Phaser.Math.Distance.Between(ball.x, ball.y, p1.x, p1.y);
        const dist2 = Phaser.Math.Distance.Between(ball.x, ball.y, p2.x, p2.y);
        
        // El más cercano pierde puntos
        if (dist1 < dist2) {
            this.scene.player1.score = Math.max(0, this.scene.player1.score - this.explosionPenalty);
            this.scene.uiManager.showMessage(`¡EXPLOSIÓN! -${this.explosionPenalty} J1`, 1500);
        } else if (dist2 < dist1) {
            this.scene.player2.score = Math.max(0, this.scene.player2.score - this.explosionPenalty);
            this.scene.uiManager.showMessage(`¡EXPLOSIÓN! -${this.explosionPenalty} J2`, 1500);
        } else {
            // Empate de distancia, ambos pierden
            this.scene.player1.score = Math.max(0, this.scene.player1.score - this.explosionPenalty / 2);
            this.scene.player2.score = Math.max(0, this.scene.player2.score - this.explosionPenalty / 2);
            this.scene.uiManager.showMessage('¡EXPLOSIÓN! Ambos afectados', 1500);
        }
        
        // Efecto visual de explosión
        this.scene.cameras.main.shake(200, 0.02);
        
        // Resetear
        this.scene.ball.reset();
        this.scene.ball.sprite.setFillStyle(0xffff00);
        this.explosionTimer = 0;
    }
    
    cleanup() {
        super.cleanup();
        // Restaurar color del balón
        if (this.scene.ball) {
            this.scene.ball.sprite.setFillStyle(COLORS.ball);
        }
    }
}

// =============================================================================
// MODO HÍBRIDO 6: TENIS + EMPUJÓN LIBRE (Rally de Impacto)
// =============================================================================

class ImpactRallyMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "RALLY DE IMPACTO", 
            "El balón debe cruzar la línea central constantemente",
            "Tenis",
            "Empujón Libre"
        );
        this.centerLine = null;
        this.lastSide = null; // 'left' o 'right'
        this.ballInPlay = true;
        this.touchedByPlayer = { 1: false, 2: false };
        this.lastTouchedBy = null;
    }
    
    setupArena() {
        // Línea central divisoria
        this.centerLine = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            6, GAME_CONFIG.height - GAME_CONFIG.arenaMargin * 2,
            0xffffff, 0.8
        );
        this.arenaElements.push(this.centerLine);
        
        // Zonas de campo
        const leftZone = this.scene.add.rectangle(
            GAME_CONFIG.width / 4, GAME_CONFIG.height / 2,
            GAME_CONFIG.width / 2 - 30, GAME_CONFIG.height - 100,
            COLORS.goal1, 0.1
        );
        leftZone.setDepth(-1);
        this.arenaElements.push(leftZone);
        
        const rightZone = this.scene.add.rectangle(
            GAME_CONFIG.width * 3 / 4, GAME_CONFIG.height / 2,
            GAME_CONFIG.width / 2 - 30, GAME_CONFIG.height - 100,
            COLORS.goal2, 0.1
        );
        rightZone.setDepth(-1);
        this.arenaElements.push(rightZone);
        
        // Indicadores de lado
        this.sideText1 = this.scene.add.text(
            GAME_CONFIG.width / 4, 80,
            'LADO J1', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#3498db'
            }
        ).setOrigin(0.5);
        this.arenaElements.push(this.sideText1);
        
        this.sideText2 = this.scene.add.text(
            GAME_CONFIG.width * 3 / 4, 80,
            'LADO J2', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#e74c3c'
            }
        ).setOrigin(0.5);
        this.arenaElements.push(this.sideText2);
    }
    
    setupBall() {
        super.setupBall();
        this.lastSide = null;
        this.ballInPlay = true;
        this.touchedByPlayer = { 1: false, 2: false };
        this.lastTouchedBy = null;
        
        // Dar velocidad inicial al balón
        const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
        this.scene.ball.sprite.body.setVelocity(direction * 150, Phaser.Math.Between(-100, 100));
    }
    
    updateModeLogic(delta) {
        const ball = this.scene.ball.sprite;
        const centerX = GAME_CONFIG.width / 2;
        const p1 = this.scene.player1.sprite;
        const p2 = this.scene.player2.sprite;
        
        // Determinar en qué lado está el balón
        const currentSide = ball.x < centerX ? 'left' : 'right';
        
        // Detectar si el balón cruza la línea central
        if (this.lastSide && this.lastSide !== currentSide) {
            // El balón cruzó
            this.touchedByPlayer = { 1: false, 2: false };
        }
        this.lastSide = currentSide;
        
        // Detectar contacto con jugadores
        const dist1 = Phaser.Math.Distance.Between(ball.x, ball.y, p1.x, p1.y);
        const dist2 = Phaser.Math.Distance.Between(ball.x, ball.y, p2.x, p2.y);
        const touchDist = GAME_CONFIG.playerRadius + GAME_CONFIG.ballRadius + 5;
        
        if (dist1 < touchDist) {
            this.touchedByPlayer[1] = true;
            this.lastTouchedBy = 1;
        }
        if (dist2 < touchDist) {
            this.touchedByPlayer[2] = true;
            this.lastTouchedBy = 2;
        }
        
        // Verificar si el balón cae en un lado sin ser tocado por el jugador de ese lado
        // El balón está "muerto" si su velocidad es muy baja en un lado
        const ballSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
        
        if (ballSpeed < 30 && this.ballInPlay) {
            // El balón se detuvo
            if (currentSide === 'left' && !this.touchedByPlayer[1]) {
                // Cayó en lado de J1 sin que J1 lo tocara - punto para J2
                this.scene.player2.addScore(1);
                this.scene.uiManager.showMessage('¡PUNTO! +1 J2', 1000);
                this.resetRally();
            } else if (currentSide === 'right' && !this.touchedByPlayer[2]) {
                // Cayó en lado de J2 sin que J2 lo tocara - punto para J1
                this.scene.player1.addScore(1);
                this.scene.uiManager.showMessage('¡PUNTO! +1 J1', 1000);
                this.resetRally();
            } else {
                // El balón se detuvo pero ambos lo tocaron, relanzar
                this.resetRally();
            }
        }
        
        // Verificar si el balón sale por los bordes superior/inferior (fuera)
        if (ball.y <= GAME_CONFIG.arenaMargin || ball.y >= GAME_CONFIG.height - GAME_CONFIG.arenaMargin) {
            // El último en tocar pierde el punto
            if (this.lastTouchedBy === 1) {
                this.scene.player2.addScore(1);
                this.scene.uiManager.showMessage('¡FUERA! +1 J2', 1000);
            } else if (this.lastTouchedBy === 2) {
                this.scene.player1.addScore(1);
                this.scene.uiManager.showMessage('¡FUERA! +1 J1', 1000);
            }
            this.resetRally();
        }
    }
    
    resetRally() {
        this.ballInPlay = false;
        this.scene.time.delayedCall(1000, () => {
            this.setupBall();
            this.setupPlayers();
        });
    }
}

// =============================================================================
// MODO ESPECIAL: FUSIÓN TOTAL (Combina 2 sistemas)
// =============================================================================

class TotalFusionMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "¡FUSIÓN TOTAL!", 
            "Lava progresiva + Porterías móviles",
            "Fusión",
            "Total"
        );
        this.movingGoals = [];
        this.goalSpeed = 60;
        this.goalDirection = [1, -1];
        this.lavaZone = null;
        this.safeZone = null;
        this.currentSafeRadius = 300;
        this.minSafeRadius = 100;
        this.shrinkRate = 5;
        this.lavaDamageRate = 3;
    }
    
    setupArena() {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        
        // LAVA: Zona de lava
        this.lavaZone = this.scene.add.rectangle(
            centerX, centerY,
            GAME_CONFIG.width, GAME_CONFIG.height,
            COLORS.lava, 0.2
        );
        this.lavaZone.setDepth(-2);
        this.arenaElements.push(this.lavaZone);
        
        // Zona segura que se reduce
        this.safeZone = this.scene.add.circle(
            centerX, centerY,
            this.currentSafeRadius,
            COLORS.safeZone, 0.25
        );
        this.safeZone.setStrokeStyle(4, COLORS.safeZone);
        this.safeZone.setDepth(-1);
        this.arenaElements.push(this.safeZone);
        
        // PORTERÍAS MÓVILES
        const goalHeight = 70;
        const goalWidth = 25;
        
        this.goal1 = this.scene.add.rectangle(
            70, centerY,
            goalWidth, goalHeight,
            COLORS.goal1
        );
        this.scene.physics.add.existing(this.goal1, false);
        this.goal1.body.setImmovable(true);
        this.arenaElements.push(this.goal1);
        
        this.goal2 = this.scene.add.rectangle(
            GAME_CONFIG.width - 70, centerY,
            goalWidth, goalHeight,
            COLORS.goal2
        );
        this.scene.physics.add.existing(this.goal2, false);
        this.goal2.body.setImmovable(true);
        this.arenaElements.push(this.goal2);
        
        this.movingGoals = [this.goal1, this.goal2];
        
        // Detectar goles
        this.goalOverlap1 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal1, () => {
                if (this.isActive) this.scoreGoal(2);
            }
        );
        
        this.goalOverlap2 = this.scene.physics.add.overlap(
            this.scene.ball.sprite, this.goal2, () => {
                if (this.isActive) this.scoreGoal(1);
            }
        );
        
        // Puntos iniciales
        this.scene.player1.score = 30;
        this.scene.player2.score = 30;
    }
    
    setupBall() {
        super.setupBall();
        this.scene.ball.sprite.body.setBounce(1.1);
    }
    
    scoreGoal(playerNumber) {
        const player = playerNumber === 1 ? this.scene.player1 : this.scene.player2;
        player.addScore(3); // Goles valen más en Fusión Total
        this.scene.uiManager.showMessage(`¡GOL TOTAL! +3 J${playerNumber}`, 1000);
        this.scene.ball.reset();
    }
    
    updateModeLogic(delta) {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        
        // Reducir zona segura
        if (this.currentSafeRadius > this.minSafeRadius) {
            this.currentSafeRadius -= (this.shrinkRate * delta) / 1000;
            this.safeZone.setRadius(Math.max(this.currentSafeRadius, this.minSafeRadius));
        }
        
        // Daño por lava
        [this.scene.player1, this.scene.player2].forEach(player => {
            const playerDist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y, centerX, centerY
            );
            
            if (playerDist > this.currentSafeRadius) {
                const damage = (this.lavaDamageRate * delta) / 1000;
                player.score = Math.max(0, player.score - damage);
            }
        });
        
        // Mover porterías
        const margin = 120;
        const maxY = GAME_CONFIG.height - margin;
        const minY = margin;
        
        this.movingGoals.forEach((goal, index) => {
            const newY = goal.y + (this.goalSpeed * this.goalDirection[index] * delta) / 1000;
            
            if (newY >= maxY || newY <= minY) {
                this.goalDirection[index] *= -1;
            }
            
            goal.setY(Phaser.Math.Clamp(newY, minY, maxY));
            goal.body.updateFromGameObject();
        });
    }
    
    cleanup() {
        super.cleanup();
        if (this.scene.ball) {
            this.scene.ball.sprite.body.setBounce(0.8);
        }
        if (this.goalOverlap1) this.goalOverlap1.destroy();
        if (this.goalOverlap2) this.goalOverlap2.destroy();
    }
}

// =============================================================================
// GAME MODE MANAGER
// =============================================================================

class GameModeManager {
    constructor(scene) {
        this.scene = scene;
        this.modes = [];
        this.currentMode = null;
        this.currentModeIndex = -1;
        this.modeTimer = 0;
        this.isTransitioning = false;
        this.globalScores = { player1: 0, player2: 0 };
        this.totalGameTime = 0;
        this.isFinalMinute = false;
        this.modesPlayed = 0;
        
        // Registrar modos
        this.registerModes();
    }
    
    registerModes() {
        this.modes = [
            new SurvivalGoalMode(this.scene),
            new CarryDominanceMode(this.scene),
            new TripleRiskMode(this.scene),
            new DynamicGoalMode(this.scene),
            new ExplosiveBallMode(this.scene),
            new ImpactRallyMode(this.scene)
        ];
        
        // Modo especial para el último minuto
        this.fusionTotalMode = new TotalFusionMode(this.scene);
    }
    
    start() {
        this.selectNextMode();
    }
    
    selectNextMode() {
        // Verificar si es el último minuto (después de 6 modos = 6 minutos)
        if (this.modesPlayed >= 6 && !this.isFinalMinute) {
            this.isFinalMinute = true;
            this.startMode(this.fusionTotalMode);
            return;
        }
        
        // Seleccionar modo aleatorio (sin repetir el último)
        let nextIndex;
        do {
            nextIndex = Phaser.Math.Between(0, this.modes.length - 1);
        } while (nextIndex === this.currentModeIndex && this.modes.length > 1);
        
        this.currentModeIndex = nextIndex;
        this.startMode(this.modes[nextIndex]);
    }
    
    startMode(mode) {
        // Limpiar modo anterior
        if (this.currentMode) {
            this.currentMode.destroy();
        }
        
        this.currentMode = mode;
        this.modeTimer = GAME_CONFIG.modeDuration;
        this.isTransitioning = false;
        
        // Mostrar transición con "NUEVA FUSIÓN:"
        this.scene.uiManager.showModeTransition(
            `NUEVA FUSIÓN: ${mode.name}`, 
            mode.description
        );
        
        // Iniciar modo después de transición
        this.scene.time.delayedCall(GAME_CONFIG.transitionDuration, () => {
            mode.start();
            this.scene.uiManager.hideTransition();
        });
    }
    
    update(delta) {
        if (this.isTransitioning) return;
        
        // Actualizar timer
        this.modeTimer -= delta;
        this.totalGameTime += delta;
        
        // Actualizar modo actual
        if (this.currentMode && this.currentMode.isActive) {
            this.currentMode.update(delta);
        }
        
        // Pausa antes de cambiar (1 segundo antes del fin)
        if (this.modeTimer <= GAME_CONFIG.pauseBeforeChange && this.modeTimer > 0 && !this.isTransitioning) {
            // Mostrar aviso de cambio
            if (Math.ceil(this.modeTimer / 1000) === 1) {
                this.scene.uiManager.showMessage('¡CAMBIO DE MODO!', 1000);
            }
        }
        
        // Verificar fin del modo
        if (this.modeTimer <= 0 && !this.isTransitioning) {
            this.endCurrentMode();
        }
    }
    
    endCurrentMode() {
        this.isTransitioning = true;
        this.modesPlayed++;
        
        if (this.currentMode) {
            this.currentMode.end();
            
            // Actualizar puntuación global
            const winner = this.currentMode.getWinner();
            if (winner === 1) {
                this.globalScores.player1++;
            } else if (winner === 2) {
                this.globalScores.player2++;
            }
            
            // Mostrar resultado
            let resultText = winner === 0 ? "¡EMPATE!" : `¡GANA JUGADOR ${winner}!`;
            this.scene.uiManager.showMessage(resultText, 2000);
            
            // Verificar si el juego terminó (después de Fusión Total)
            if (this.isFinalMinute) {
                this.scene.time.delayedCall(2500, () => {
                    this.showFinalResult();
                });
            } else {
                // Cambiar al siguiente modo
                this.scene.time.delayedCall(2500, () => {
                    this.selectNextMode();
                });
            }
        }
    }
    
    showFinalResult() {
        const p1Score = this.globalScores.player1;
        const p2Score = this.globalScores.player2;
        let finalMessage;
        
        if (p1Score > p2Score) {
            finalMessage = `¡JUGADOR 1 GANA EL TORNEO!\n${p1Score} - ${p2Score}`;
        } else if (p2Score > p1Score) {
            finalMessage = `¡JUGADOR 2 GANA EL TORNEO!\n${p1Score} - ${p2Score}`;
        } else {
            finalMessage = `¡EMPATE ÉPICO!\n${p1Score} - ${p2Score}`;
        }
        
        this.scene.uiManager.showMessage(finalMessage, 10000);
    }
    
    getTimeRemaining() {
        return Math.max(0, Math.ceil(this.modeTimer / 1000));
    }
    
    getCurrentModeName() {
        return this.currentMode ? this.currentMode.name : "";
    }
    
    getGlobalScores() {
        return this.globalScores;
    }
    
    isFinalMode() {
        return this.isFinalMinute;
    }
}

// =============================================================================
// UI MANAGER
// =============================================================================

class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.elements = {};
        
        this.createUI();
    }
    
    createUI() {
        const textStyle = {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        };
        
        const largeTextStyle = {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        };
        
        // Puntuación Jugador 1
        this.elements.score1 = this.scene.add.text(
            20, 20,
            'J1: 0',
            { ...textStyle, color: '#3498db' }
        );
        this.elements.score1.setDepth(100);
        
        // Puntuación Jugador 2
        this.elements.score2 = this.scene.add.text(
            GAME_CONFIG.width - 120, 20,
            'J2: 0',
            { ...textStyle, color: '#e74c3c' }
        );
        this.elements.score2.setDepth(100);
        
        // Timer
        this.elements.timer = this.scene.add.text(
            GAME_CONFIG.width / 2, 20,
            '60',
            textStyle
        ).setOrigin(0.5, 0);
        this.elements.timer.setDepth(100);
        
        // Nombre del modo actual
        this.elements.modeName = this.scene.add.text(
            GAME_CONFIG.width / 2, 50,
            '',
            { ...textStyle, fontSize: '18px' }
        ).setOrigin(0.5, 0);
        this.elements.modeName.setDepth(100);
        
        // Puntuación global
        this.elements.globalScore = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height - 30,
            'GLOBAL: 0 - 0',
            { ...textStyle, fontSize: '20px' }
        ).setOrigin(0.5);
        this.elements.globalScore.setDepth(100);
        
        // Mensaje central (para notificaciones)
        this.elements.centerMessage = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            '',
            largeTextStyle
        ).setOrigin(0.5);
        this.elements.centerMessage.setDepth(200);
        this.elements.centerMessage.setVisible(false);
        
        // Panel de transición
        this.elements.transitionPanel = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            GAME_CONFIG.width, GAME_CONFIG.height,
            0x000000, 0.8
        );
        this.elements.transitionPanel.setDepth(150);
        this.elements.transitionPanel.setVisible(false);
        
        // Texto de transición (nombre del modo)
        this.elements.transitionTitle = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2 - 50,
            '',
            { ...largeTextStyle, fontSize: '42px' }
        ).setOrigin(0.5);
        this.elements.transitionTitle.setDepth(151);
        this.elements.transitionTitle.setVisible(false);
        
        // Descripción del modo
        this.elements.transitionDesc = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2 + 30,
            '',
            { ...textStyle, fontSize: '24px' }
        ).setOrigin(0.5);
        this.elements.transitionDesc.setDepth(151);
        this.elements.transitionDesc.setVisible(false);
        
        // Instrucciones de controles
        this.elements.controls = this.scene.add.text(
            GAME_CONFIG.width / 2, GAME_CONFIG.height - 60,
            'J1: WASD + F | J2: Flechas + Shift',
            { ...textStyle, fontSize: '14px', color: '#aaaaaa' }
        ).setOrigin(0.5);
        this.elements.controls.setDepth(100);
    }
    
    update() {
        // Actualizar puntuaciones
        this.elements.score1.setText(`J1: ${Math.floor(this.scene.player1.score)}`);
        this.elements.score2.setText(`J2: ${Math.floor(this.scene.player2.score)}`);
        
        // Actualizar timer
        const timeRemaining = this.scene.gameModeManager.getTimeRemaining();
        this.elements.timer.setText(timeRemaining.toString());
        
        // Color del timer según tiempo restante
        if (timeRemaining <= 10) {
            this.elements.timer.setColor('#ff0000');
        } else if (timeRemaining <= 30) {
            this.elements.timer.setColor('#ffff00');
        } else {
            this.elements.timer.setColor('#ffffff');
        }
        
        // Actualizar nombre del modo
        this.elements.modeName.setText(this.scene.gameModeManager.getCurrentModeName());
        
        // Actualizar puntuación global
        const globalScores = this.scene.gameModeManager.getGlobalScores();
        this.elements.globalScore.setText(`GLOBAL: ${globalScores.player1} - ${globalScores.player2}`);
    }
    
    showMessage(text, duration = 1500) {
        this.elements.centerMessage.setText(text);
        this.elements.centerMessage.setVisible(true);
        
        this.scene.time.delayedCall(duration, () => {
            this.elements.centerMessage.setVisible(false);
        });
    }
    
    showModeTransition(title, description) {
        this.elements.transitionPanel.setVisible(true);
        this.elements.transitionTitle.setText(title);
        this.elements.transitionTitle.setVisible(true);
        this.elements.transitionDesc.setText(description);
        this.elements.transitionDesc.setVisible(true);
    }
    
    hideTransition() {
        this.elements.transitionPanel.setVisible(false);
        this.elements.transitionTitle.setVisible(false);
        this.elements.transitionDesc.setVisible(false);
    }
}

// =============================================================================
// ESCENA PRINCIPAL
// =============================================================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        // Crear arena
        this.createArena();
        
        // Crear controles
        this.createControls();
        
        // Crear jugadores
        this.createPlayers();
        
        // Crear balón
        this.createBall();
        
        // Configurar colisiones
        this.setupCollisions();
        
        // Crear UI Manager
        this.uiManager = new UIManager(this);
        
        // Crear Game Mode Manager
        this.gameModeManager = new GameModeManager(this);
        
        // Iniciar el juego
        this.gameModeManager.start();
    }
    
    createArena() {
        // Fondo de la arena
        this.add.rectangle(
            GAME_CONFIG.width / 2, 
            GAME_CONFIG.height / 2,
            GAME_CONFIG.width - GAME_CONFIG.arenaMargin,
            GAME_CONFIG.height - GAME_CONFIG.arenaMargin,
            COLORS.arena
        ).setDepth(-10);
        
        // Borde de la arena
        const border = this.add.rectangle(
            GAME_CONFIG.width / 2, 
            GAME_CONFIG.height / 2,
            GAME_CONFIG.width - GAME_CONFIG.arenaMargin,
            GAME_CONFIG.height - GAME_CONFIG.arenaMargin
        );
        border.setStrokeStyle(4, 0x4a4a6a);
        border.setDepth(-9);
        
        // Línea central
        this.add.line(
            GAME_CONFIG.width / 2,
            GAME_CONFIG.height / 2,
            0, -GAME_CONFIG.height / 2 + GAME_CONFIG.arenaMargin,
            0, GAME_CONFIG.height / 2 - GAME_CONFIG.arenaMargin,
            0x4a4a6a
        ).setLineWidth(2);
        
        // Círculo central
        const centerCircle = this.add.circle(
            GAME_CONFIG.width / 2,
            GAME_CONFIG.height / 2,
            80
        );
        centerCircle.setStrokeStyle(2, 0x4a4a6a);
    }
    
    createControls() {
        // Controles Jugador 1 (WASD + F)
        this.player1Controls = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
        };
        
        // Controles Jugador 2 (Flechas + Shift)
        this.player2Controls = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        };
    }
    
    createPlayers() {
        // Jugador 1 (Azul, lado izquierdo)
        this.player1 = new Player(
            this, 
            200, 
            GAME_CONFIG.height / 2,
            COLORS.player1,
            this.player1Controls,
            1
        );
        
        // Jugador 2 (Rojo, lado derecho)
        this.player2 = new Player(
            this,
            GAME_CONFIG.width - 200,
            GAME_CONFIG.height / 2,
            COLORS.player2,
            this.player2Controls,
            2
        );
    }
    
    createBall() {
        this.ball = new Ball(
            this,
            GAME_CONFIG.width / 2,
            GAME_CONFIG.height / 2
        );
    }
    
    setupCollisions() {
        // Colisión entre jugadores
        this.physics.add.collider(
            this.player1.sprite, 
            this.player2.sprite,
            this.handlePlayerCollision,
            null,
            this
        );
        
        // Colisión jugador 1 con balón
        this.physics.add.collider(
            this.player1.sprite,
            this.ball.sprite,
            (player, ball) => this.handleBallCollision(this.player1, ball),
            null,
            this
        );
        
        // Colisión jugador 2 con balón
        this.physics.add.collider(
            this.player2.sprite,
            this.ball.sprite,
            (player, ball) => this.handleBallCollision(this.player2, ball),
            null,
            this
        );
    }
    
    handlePlayerCollision(sprite1, sprite2) {
        // Las colisiones físicas se manejan automáticamente por Phaser
    }
    
    handleBallCollision(player, ballSprite) {
        // El balón recibe un empuje basado en la velocidad del jugador
        const pushFactor = 0.5;
        this.ball.sprite.body.velocity.x += player.sprite.body.velocity.x * pushFactor;
        this.ball.sprite.body.velocity.y += player.sprite.body.velocity.y * pushFactor;
    }
    
    update(time, delta) {
        // Actualizar jugadores
        this.player1.update(delta);
        this.player2.update(delta);
        
        // Actualizar balón
        this.ball.update();
        
        // Manejar empuje
        this.handlePush();
        
        // Actualizar Game Mode Manager
        this.gameModeManager.update(delta);
        
        // Actualizar UI
        this.uiManager.update();
    }
    
    handlePush() {
        // Jugador 1 empuja
        if (Phaser.Input.Keyboard.JustDown(this.player1Controls.push)) {
            if (this.player1.doPush()) {
                this.applyPush(this.player1, this.player2);
                this.applyPushToBall(this.player1);
            }
        }
        
        // Jugador 2 empuja
        if (Phaser.Input.Keyboard.JustDown(this.player2Controls.push)) {
            if (this.player2.doPush()) {
                this.applyPush(this.player2, this.player1);
                this.applyPushToBall(this.player2);
            }
        }
    }
    
    applyPush(pusher, target) {
        // Calcular distancia entre jugadores
        const distance = Phaser.Math.Distance.Between(
            pusher.sprite.x, pusher.sprite.y,
            target.sprite.x, target.sprite.y
        );
        
        // Solo empujar si está cerca
        if (distance < GAME_CONFIG.playerRadius * 3) {
            // Calcular dirección del empuje
            const angle = Phaser.Math.Angle.Between(
                pusher.sprite.x, pusher.sprite.y,
                target.sprite.x, target.sprite.y
            );
            
            // Aplicar fuerza
            const forceX = Math.cos(angle) * GAME_CONFIG.pushForce;
            const forceY = Math.sin(angle) * GAME_CONFIG.pushForce;
            
            target.sprite.body.velocity.x += forceX;
            target.sprite.body.velocity.y += forceY;
            
            // Efecto visual
            this.cameras.main.shake(50, 0.005);
        }
    }
    
    applyPushToBall(pusher) {
        // Calcular distancia al balón
        const distance = Phaser.Math.Distance.Between(
            pusher.sprite.x, pusher.sprite.y,
            this.ball.sprite.x, this.ball.sprite.y
        );
        
        // Solo empujar si está cerca
        if (distance < GAME_CONFIG.playerRadius * 3) {
            // Calcular dirección del empuje
            const angle = Phaser.Math.Angle.Between(
                pusher.sprite.x, pusher.sprite.y,
                this.ball.sprite.x, this.ball.sprite.y
            );
            
            // Aplicar fuerza al balón
            const forceX = Math.cos(angle) * GAME_CONFIG.pushForce * 1.5;
            const forceY = Math.sin(angle) * GAME_CONFIG.pushForce * 1.5;
            
            this.ball.applyForce(forceX, forceY);
        }
    }
}

// =============================================================================
// CONFIGURACIÓN PHASER
// =============================================================================

const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene]
};

// =============================================================================
// INICIALIZACIÓN DEL JUEGO
// =============================================================================

// Iniciar el juego cuando el DOM esté listo
window.onload = () => {
    const game = new Phaser.Game(config);
};
