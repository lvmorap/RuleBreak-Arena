/**
 * Robot Arena Mutante
 * MVP - Juego competitivo 2D arcade para 2 jugadores locales
 * Inspirado en Brawl Stars con cambio automático de modos cada 60 segundos
 */

// =============================================================================
// CONFIGURACIÓN DEL JUEGO
// =============================================================================

const GAME_CONFIG = {
    width: 1024,
    height: 768,
    playerSpeed: 250,
    pushForce: 500,
    pushCooldown: 1000, // 1 segundo
    modeDuration: 60000, // 60 segundos
    transitionDuration: 2000, // 2 segundos de transición
    ballDrag: 0.98,
    playerRadius: 25,
    ballRadius: 15,
    arenaMargin: 50,
    goalWidth: 100,
    safeZoneRadius: 180
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
    dangerZone: 0xe74c3c, // Rojo
    ui: 0xecf0f1      // Blanco humo
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
// MODO 1: GOL
// =============================================================================

class GoalMode extends GameMode {
    constructor(scene) {
        super(scene, "¡MODO GOL!", "Anota en la portería rival");
        this.goals = [];
    }
    
    start() {
        super.start();
        
        // Resetear puntuaciones
        this.scene.player1.resetScore();
        this.scene.player2.resetScore();
        
        // Mostrar balón
        this.scene.ball.setVisible(true);
        this.scene.ball.reset();
        
        // Crear porterías
        this.createGoals();
        
        // Resetear posiciones de jugadores
        this.scene.player1.reset(200, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width - 200, GAME_CONFIG.height / 2);
    }
    
    createGoals() {
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
        
        // Portería derecha (jugador 1 anota aquí)
        this.goal2 = this.scene.add.rectangle(
            GAME_CONFIG.width - goalWidth / 2, centerY, 
            goalWidth, goalHeight, 
            COLORS.goal2
        );
        this.scene.physics.add.existing(this.goal2, true);
        
        this.goals = [this.goal1, this.goal2];
        
        // Detectar goles
        this.scene.physics.add.overlap(this.scene.ball.sprite, this.goal1, () => {
            if (this.isActive) this.scoreGoal(2); // Jugador 2 anota
        });
        
        this.scene.physics.add.overlap(this.scene.ball.sprite, this.goal2, () => {
            if (this.isActive) this.scoreGoal(1); // Jugador 1 anota
        });
    }
    
    scoreGoal(playerNumber) {
        const player = playerNumber === 1 ? this.scene.player1 : this.scene.player2;
        player.addScore(1);
        
        // Efecto visual de gol
        this.scene.uiManager.showMessage(`¡GOL! Jugador ${playerNumber}`, 1000);
        
        // Resetear balón y jugadores
        this.scene.ball.reset();
        this.scene.player1.reset(200, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width - 200, GAME_CONFIG.height / 2);
    }
    
    update(delta) {
        // La lógica de goles se maneja por colisiones
    }
    
    checkWinCondition() {
        if (this.scene.player1.score > this.scene.player2.score) {
            this.winner = 1;
        } else if (this.scene.player2.score > this.scene.player1.score) {
            this.winner = 2;
        } else {
            this.winner = 0; // Empate
        }
    }
    
    destroy() {
        this.goals.forEach(goal => goal.destroy());
        this.goals = [];
    }
}

// =============================================================================
// MODO 2: POSESIÓN
// =============================================================================

class PossessionMode extends GameMode {
    constructor(scene) {
        super(scene, "¡MODO POSESIÓN!", "Mantén el balón cerca de ti");
        this.possessionDistance = 50;
    }
    
    start() {
        super.start();
        
        // Resetear tiempos de posesión
        this.scene.player1.possessionTime = 0;
        this.scene.player2.possessionTime = 0;
        this.scene.player1.resetScore();
        this.scene.player2.resetScore();
        
        // Mostrar balón
        this.scene.ball.setVisible(true);
        this.scene.ball.reset();
        
        // Resetear posiciones
        this.scene.player1.reset(200, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width - 200, GAME_CONFIG.height / 2);
    }
    
    update(delta) {
        const ball = this.scene.ball.sprite;
        const p1 = this.scene.player1.sprite;
        const p2 = this.scene.player2.sprite;
        
        // Calcular distancias
        const dist1 = Phaser.Math.Distance.Between(ball.x, ball.y, p1.x, p1.y);
        const dist2 = Phaser.Math.Distance.Between(ball.x, ball.y, p2.x, p2.y);
        
        // Acumular tiempo de posesión
        if (dist1 < this.possessionDistance && dist1 < dist2) {
            this.scene.player1.possessionTime += delta;
            this.scene.player1.score = Math.floor(this.scene.player1.possessionTime / 1000);
        } else if (dist2 < this.possessionDistance && dist2 < dist1) {
            this.scene.player2.possessionTime += delta;
            this.scene.player2.score = Math.floor(this.scene.player2.possessionTime / 1000);
        }
    }
    
    checkWinCondition() {
        if (this.scene.player1.possessionTime > this.scene.player2.possessionTime) {
            this.winner = 1;
        } else if (this.scene.player2.possessionTime > this.scene.player1.possessionTime) {
            this.winner = 2;
        } else {
            this.winner = 0;
        }
    }
    
    destroy() {
        // No hay elementos especiales que destruir
    }
}

// =============================================================================
// MODO 3: COMBATE
// =============================================================================

class CombatMode extends GameMode {
    constructor(scene) {
        super(scene, "¡MODO COMBATE!", "Empuja al rival contra las paredes");
    }
    
    start() {
        super.start();
        
        // Resetear puntuaciones
        this.scene.player1.resetScore();
        this.scene.player2.resetScore();
        
        // Ocultar balón
        this.scene.ball.setVisible(false);
        
        // Resetear posiciones al centro
        this.scene.player1.reset(GAME_CONFIG.width / 2 - 100, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width / 2 + 100, GAME_CONFIG.height / 2);
    }
    
    update(delta) {
        // Verificar si algún jugador está cerca del borde (empujado)
        this.checkWallCollision(this.scene.player1, 2);
        this.checkWallCollision(this.scene.player2, 1);
    }
    
    checkWallCollision(player, scoringPlayer) {
        const margin = 10;
        const sprite = player.sprite;
        
        // Verificar si está tocando alguna pared con velocidad significativa
        const speed = Math.sqrt(
            sprite.body.velocity.x ** 2 + 
            sprite.body.velocity.y ** 2
        );
        
        if (speed > 200) {
            if (sprite.x <= GAME_CONFIG.playerRadius + margin ||
                sprite.x >= GAME_CONFIG.width - GAME_CONFIG.playerRadius - margin ||
                sprite.y <= GAME_CONFIG.playerRadius + margin ||
                sprite.y >= GAME_CONFIG.height - GAME_CONFIG.playerRadius - margin) {
                
                const scoringPlayerObj = scoringPlayer === 1 ? this.scene.player1 : this.scene.player2;
                scoringPlayerObj.addScore(1);
                
                this.scene.uiManager.showMessage(`¡IMPACTO! Punto J${scoringPlayer}`, 500);
                
                // Resetear posiciones
                setTimeout(() => {
                    this.scene.player1.reset(GAME_CONFIG.width / 2 - 100, GAME_CONFIG.height / 2);
                    this.scene.player2.reset(GAME_CONFIG.width / 2 + 100, GAME_CONFIG.height / 2);
                }, 500);
            }
        }
    }
    
    checkWinCondition() {
        if (this.scene.player1.score > this.scene.player2.score) {
            this.winner = 1;
        } else if (this.scene.player2.score > this.scene.player1.score) {
            this.winner = 2;
        } else {
            this.winner = 0;
        }
    }
    
    destroy() {
        // No hay elementos especiales que destruir
    }
}

// =============================================================================
// MODO 4: ZONA SEGURA
// =============================================================================

class SafeZoneMode extends GameMode {
    constructor(scene) {
        super(scene, "¡MODO ZONA SEGURA!", "¡Mantente en el centro!");
        this.safeZone = null;
        this.dangerZone = null;
        this.damageRate = 10; // Puntos perdidos por segundo fuera de zona
    }
    
    start() {
        super.start();
        
        // Iniciar con puntos altos (supervivencia)
        this.scene.player1.score = 100;
        this.scene.player2.score = 100;
        
        // Ocultar balón
        this.scene.ball.setVisible(false);
        
        // Crear zonas
        this.createZones();
        
        // Resetear posiciones
        this.scene.player1.reset(GAME_CONFIG.width / 2 - 50, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width / 2 + 50, GAME_CONFIG.height / 2);
    }
    
    createZones() {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        
        // Zona de peligro (fondo rojo)
        this.dangerZone = this.scene.add.rectangle(
            centerX, centerY,
            GAME_CONFIG.width, GAME_CONFIG.height,
            COLORS.dangerZone, 0.2
        );
        this.dangerZone.setDepth(-1);
        
        // Zona segura (círculo verde)
        this.safeZone = this.scene.add.circle(
            centerX, centerY,
            GAME_CONFIG.safeZoneRadius,
            COLORS.safeZone, 0.3
        );
        this.safeZone.setStrokeStyle(4, COLORS.safeZone);
        this.safeZone.setDepth(-1);
    }
    
    update(delta) {
        const centerX = GAME_CONFIG.width / 2;
        const centerY = GAME_CONFIG.height / 2;
        
        // Verificar cada jugador
        [this.scene.player1, this.scene.player2].forEach(player => {
            const dist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y,
                centerX, centerY
            );
            
            if (dist > GAME_CONFIG.safeZoneRadius) {
                // Fuera de zona segura - perder puntos
                const damage = (this.damageRate * delta) / 1000;
                player.score = Math.max(0, player.score - damage);
                player.inSafeZone = false;
            } else {
                player.inSafeZone = true;
            }
        });
    }
    
    checkWinCondition() {
        // Gana quien tenga más puntos (sobrevivió más en zona)
        if (this.scene.player1.score > this.scene.player2.score) {
            this.winner = 1;
        } else if (this.scene.player2.score > this.scene.player1.score) {
            this.winner = 2;
        } else {
            this.winner = 0;
        }
    }
    
    destroy() {
        if (this.safeZone) this.safeZone.destroy();
        if (this.dangerZone) this.dangerZone.destroy();
    }
}

// =============================================================================
// MODO 5: EMPUJÓN EXTREMO
// =============================================================================

class ExtremePushMode extends GameMode {
    constructor(scene) {
        super(scene, "¡EMPUJÓN EXTREMO!", "¡Empuja al rival fuera del mapa!");
        this.boundary = null;
    }
    
    start() {
        super.start();
        
        // Resetear puntuaciones
        this.scene.player1.resetScore();
        this.scene.player2.resetScore();
        
        // Ocultar balón
        this.scene.ball.setVisible(false);
        
        // Crear borde visual
        this.createBoundary();
        
        // Desactivar colisión con bordes del mundo
        this.scene.player1.sprite.body.setCollideWorldBounds(false);
        this.scene.player2.sprite.body.setCollideWorldBounds(false);
        
        // Resetear posiciones
        this.scene.player1.reset(GAME_CONFIG.width / 2 - 100, GAME_CONFIG.height / 2);
        this.scene.player2.reset(GAME_CONFIG.width / 2 + 100, GAME_CONFIG.height / 2);
    }
    
    createBoundary() {
        const margin = 30;
        this.boundary = this.scene.add.rectangle(
            GAME_CONFIG.width / 2, GAME_CONFIG.height / 2,
            GAME_CONFIG.width - margin * 2, GAME_CONFIG.height - margin * 2
        );
        this.boundary.setStrokeStyle(4, 0xff0000);
        this.boundary.setDepth(-1);
    }
    
    update(delta) {
        // Verificar si algún jugador salió del mapa
        this.checkOutOfBounds(this.scene.player1, 2);
        this.checkOutOfBounds(this.scene.player2, 1);
    }
    
    checkOutOfBounds(player, scoringPlayer) {
        const sprite = player.sprite;
        const margin = 30;
        
        if (sprite.x < margin || 
            sprite.x > GAME_CONFIG.width - margin ||
            sprite.y < margin || 
            sprite.y > GAME_CONFIG.height - margin) {
            
            const scoringPlayerObj = scoringPlayer === 1 ? this.scene.player1 : this.scene.player2;
            scoringPlayerObj.addScore(1);
            
            this.scene.uiManager.showMessage(`¡ELIMINADO! Punto J${scoringPlayer}`, 1000);
            
            // Resetear posiciones
            this.scene.player1.reset(GAME_CONFIG.width / 2 - 100, GAME_CONFIG.height / 2);
            this.scene.player2.reset(GAME_CONFIG.width / 2 + 100, GAME_CONFIG.height / 2);
        }
    }
    
    checkWinCondition() {
        if (this.scene.player1.score > this.scene.player2.score) {
            this.winner = 1;
        } else if (this.scene.player2.score > this.scene.player1.score) {
            this.winner = 2;
        } else {
            this.winner = 0;
        }
    }
    
    end() {
        super.end();
        // Restaurar colisión con bordes
        this.scene.player1.sprite.body.setCollideWorldBounds(true);
        this.scene.player2.sprite.body.setCollideWorldBounds(true);
    }
    
    destroy() {
        if (this.boundary) this.boundary.destroy();
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
        
        // Registrar modos
        this.registerModes();
    }
    
    registerModes() {
        this.modes = [
            new GoalMode(this.scene),
            new PossessionMode(this.scene),
            new CombatMode(this.scene),
            new SafeZoneMode(this.scene),
            new ExtremePushMode(this.scene)
        ];
    }
    
    start() {
        this.selectNextMode();
    }
    
    selectNextMode() {
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
        
        // Mostrar transición
        this.scene.uiManager.showModeTransition(mode.name, mode.description);
        
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
        
        // Actualizar modo actual
        if (this.currentMode && this.currentMode.isActive) {
            this.currentMode.update(delta);
        }
        
        // Verificar fin del modo
        if (this.modeTimer <= 0 && !this.isTransitioning) {
            this.endCurrentMode();
        }
    }
    
    endCurrentMode() {
        this.isTransitioning = true;
        
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
            
            // Cambiar al siguiente modo
            this.scene.time.delayedCall(2500, () => {
                this.selectNextMode();
            });
        }
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
            { ...largeTextStyle, fontSize: '56px' }
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
