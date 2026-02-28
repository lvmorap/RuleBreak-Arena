# 🤖 FusionBots Arena

Un juego competitivo 2D arcade para 2 jugadores locales basado en fusiones deportivas híbridas. El modo de juego cambia automáticamente cada 60 segundos, combinando mecánicas de distintos deportes en modos únicos y experimentales.

![FusionBots Arena](https://img.shields.io/badge/Phaser-3.60.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages-orange)

## 🎮 Concepto del Juego

FusionBots Arena es un juego 2D top-down competitivo local donde dos robots compiten en una arena dinámica. Cada 60 segundos, el juego cambia automáticamente a un nuevo modo de juego que fusiona las mecánicas de dos deportes diferentes, creando experiencias de juego únicas y estratégicas.

El juego está diseñado para ser:
- **Claro en menos de 10 segundos**: Mecánicas simples e intuitivas
- **Competitivo**: Sistemas de puntuación balanceados
- **Divertido**: Acción constante y cambios dinámicos
- **Modular**: Fácil de añadir nuevos modos
- **Extensible**: Arquitectura limpia para futuras mejoras

## 🕹️ Controles

| Jugador | Movimiento | Empujar |
|---------|------------|---------|
| **Jugador 1 (Azul)** | W A S D | F |
| **Jugador 2 (Rojo)** | Flechas | Shift |

- Movimiento en 8 direcciones
- Empujar aplica impulso físico (cooldown: 800ms)

## 🎯 Modos de Juego Híbridos

### 1️⃣ GOL DE SUPERVIVENCIA (Fútbol + Sumo)
- **Mecánica principal**: Hay porterías, pero NO hay paredes laterales
- **Gol**: +1 punto
- **Empujar rival fuera del mapa**: +1 punto
- **Regla especial**: Si el jugador que anota cae fuera dentro de 3 segundos, ¡el gol se anula!

### 2️⃣ CARRY DOMINANCE (Rugby + Zona de Control)
- **Sin porterías**: El balón debe cruzar la línea rival físicamente
- **Cruzar línea rival con balón**: +2 puntos
- **Zona central circular**: Permanecer dentro suma +1 punto cada 3 segundos
- **Portador del balón**: Velocidad reducida al 70%

### 3️⃣ TRIPLE RIESGO (Baloncesto + Lava Progresiva)
- **Canasta central**: Zona pequeña para encestar
- **Encestar desde zona segura**: +1 punto
- **Encestar desde zona de lava**: +3 puntos (¡triple!)
- **Zona segura**: Se reduce progresivamente durante el modo
- **Lava**: Permanecer en ella reduce puntos gradualmente

### 4️⃣ OBJETIVO DINÁMICO (Hockey + Porterías Móviles)
- **Porterías móviles**: Dos porterías que se mueven verticalmente
- **Balón de hockey**: Rebote fuerte (120%)
- **Gol**: +1 punto
- **Estrategia**: ¡Predice el movimiento de las porterías!

### 5️⃣ IMPACTO CONTROLADO (Boxeo + Balón Explosivo)
- **Balón bomba**: Tiene un temporizador visible (8 segundos)
- **Explosión**: El jugador más cercano pierde 3 puntos
- **Mecánica clave**: Empujar al rival hacia el balón
- **El balón reaparece**: Después de cada explosión

### 6️⃣ RALLY DE IMPACTO (Tenis + Empujón Libre)
- **Línea central**: Divide el campo en dos lados
- **El balón debe cruzar**: Constantemente de un lado a otro
- **Punto para el rival**: Si el balón cae en tu lado sin que lo toques
- **Empujones libres**: Se permite empujar sin restricciones

### 🔥 FUSIÓN TOTAL (Modo Especial - Último Minuto)
- **Activación**: Se activa en el séptimo minuto del partido
- **Combina**: Lava progresiva + Porterías móviles
- **Goles valen**: +3 puntos
- **Puntos iniciales**: 30 por jugador
- **Máxima intensidad**: ¡El modo definitivo!

## 🚀 Cómo Ejecutar

### Opción 1: GitHub Pages (Recomendado)
1. Fork este repositorio
2. Ve a Settings > Pages
3. Selecciona la rama `main` como source
4. Espera unos minutos y accede a `https://tu-usuario.github.io/RuleBreak-Arena/`

### Opción 2: Localmente
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/RuleBreak-Arena.git
   ```
2. Abre `index.html` directamente en tu navegador
   - O usa un servidor local: `python -m http.server 8080`
   - Luego visita `http://localhost:8080`

**Nota**: No requiere instalación de dependencias, build tools, ni servidor backend.

## 🏗️ Arquitectura

```
RuleBreak-Arena/
├── index.html          # Página principal con Phaser 3 CDN
├── style.css           # Estilos minimalistas
├── main.js             # Lógica completa del juego
├── README.md           # Este archivo
└── LICENSE             # MIT License
```

### Estructura del Código (main.js)

```
┌─────────────────────────────────────────────────────────┐
│                    GAME_CONFIG                          │
│  (Configuración: velocidades, tamaños, cooldowns)       │
├─────────────────────────────────────────────────────────┤
│                      COLORS                             │
│  (Paleta de colores del juego)                          │
├─────────────────────────────────────────────────────────┤
│                   Clase Player                          │
│  - Movimiento 8 direcciones                             │
│  - Sistema de empuje con cooldown (800ms)               │
│  - Puntuación individual                                │
├─────────────────────────────────────────────────────────┤
│                    Clase Ball                           │
│  - Física de rebote configurable                        │
│  - Interacción con jugadores                            │
├─────────────────────────────────────────────────────────┤
│               Clase GameMode (Base)                     │
│  - start(), update(), end()                             │
│  - checkWinCondition(), getWinner()                     │
├─────────────────────────────────────────────────────────┤
│              Clase HybridMode (Abstracta)               │
│  - Extiende GameMode                                    │
│  - setupArena(), setupPlayers(), setupBall()            │
│  - updateModeLogic(), checkWinCondition(), cleanup()    │
├─────────────────────────────────────────────────────────┤
│              Modos Híbridos (6 + 1)                     │
│  - SurvivalGoalMode (Fútbol + Sumo)                     │
│  - CarryDominanceMode (Rugby + Zona)                    │
│  - TripleRiskMode (Basket + Lava)                       │
│  - DynamicGoalMode (Hockey + Porterías Móviles)         │
│  - ExplosiveBallMode (Boxeo + Bomba)                    │
│  - ImpactRallyMode (Tenis + Empujón)                    │
│  - TotalFusionMode (Fusión Total)                       │
├─────────────────────────────────────────────────────────┤
│                GameModeManager                          │
│  - Temporizador 60 segundos por modo                    │
│  - Selección aleatoria sin repetir consecutivamente     │
│  - Transiciones con overlay "NUEVA FUSIÓN:"             │
│  - Fusión Total en el último minuto                     │
├─────────────────────────────────────────────────────────┤
│                  UIManager                              │
│  - Puntuaciones (local y global)                        │
│  - Timer con colores según tiempo restante              │
│  - Mensajes centrales y transiciones                    │
├─────────────────────────────────────────────────────────┤
│                  GameScene                              │
│  - Escena principal de Phaser                           │
│  - Coordina todos los sistemas                          │
│  - Maneja colisiones y empujes                          │
├─────────────────────────────────────────────────────────┤
│              Configuración Phaser                       │
│  - Arcade Physics (gravedad: 0)                         │
│  - Inicialización del juego                             │
└─────────────────────────────────────────────────────────┘
```

## 🧩 Sistema Modular

### Cómo añadir un nuevo modo híbrido:

1. Crear una nueva clase que extienda `HybridMode`:
```javascript
class NuevoModoMode extends HybridMode {
    constructor(scene) {
        super(
            scene, 
            "NOMBRE DEL MODO", 
            "Descripción breve",
            "Deporte1",
            "Deporte2"
        );
    }
    
    setupArena() {
        // Crear elementos visuales del arena
    }
    
    setupPlayers() {
        // Posicionar jugadores
    }
    
    setupBall() {
        // Configurar el balón
    }
    
    updateModeLogic(delta) {
        // Lógica principal del modo
    }
    
    checkWinCondition() {
        // Determinar ganador
    }
    
    cleanup() {
        // Limpiar elementos al terminar
    }
}
```

2. Registrar el modo en `GameModeManager.registerModes()`:
```javascript
this.modes = [
    // ... modos existentes
    new NuevoModoMode(this.scene)
];
```

## 🎨 Estilo Visual

- **Robots**: Círculos de colores (azul y rojo)
- **Balón**: Círculo blanco con borde
- **Lava**: Rojo semitransparente
- **Zona segura**: Verde semitransparente
- **Canasta**: Púrpura
- **Fondo**: Gris oscuro (#2c3e50)
- **Sin imágenes externas**: Todo renderizado con primitivas

## ⚙️ Stack Tecnológico

- **HTML5**: Estructura básica
- **CSS3**: Estilos mínimos
- **JavaScript ES6+**: Sin transpilación
- **Phaser 3**: Framework de juegos (CDN)
- **Arcade Physics**: Sistema de físicas

## 📋 Requisitos Técnicos

- ✅ Navegador moderno con soporte ES6
- ✅ No requiere servidor backend
- ✅ No requiere Node.js
- ✅ No requiere build tools
- ✅ No requiere TypeScript
- ✅ Funciona offline (después de cargar)
- ✅ Compatible con GitHub Pages

## 🗺️ Roadmap de Mejoras Futuras

### 🎨 Polish Visual
- [ ] Animaciones de personajes
- [ ] Efectos de partículas
- [ ] Mejores transiciones animadas
- [ ] Efectos de cámara (zoom, follow)
- [ ] Sprites personalizados para robots

### 🔊 Audio
- [ ] Efectos de sonido (goles, empujes, explosiones)
- [ ] Música de fondo dinámica
- [ ] Sonidos de UI

### 🎮 Contenido
- [ ] Power-ups dinámicos (velocidad, escudo, mega-empuje)
- [ ] Más fusiones deportivas:
  - [ ] Ping Pong + Gravedad Invertida
  - [ ] Golf + Obstáculos Móviles
  - [ ] Voleibol + Trampolines
  - [ ] Béisbol + Zonas de Bonus
- [ ] Sistema de selección manual de modos
- [ ] Diferentes arenas/mapas temáticos

### 🏆 Jugabilidad
- [ ] IA básica para modo un jugador
- [ ] Sistema de torneo completo
- [ ] Modo práctica
- [ ] Balanceo de físicas
- [ ] Selección de personajes con habilidades

### 📱 UI/UX
- [ ] Pantalla de menú inicial
- [ ] Pantalla de pausa
- [ ] Configuración de controles
- [ ] Soporte para gamepads
- [ ] Responsive design para móviles
- [ ] Mejor feedback visual (indicadores, efectos)

### ⚙️ Técnico
- [ ] Optimización de rendimiento
- [ ] Guardar estadísticas locales (localStorage)
- [ ] Sistema de replay
- [ ] Exportar como PWA

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/NuevoModo`)
3. Commit tus cambios (`git commit -m 'Agrega nuevo modo de juego'`)
4. Push a la rama (`git push origin feature/NuevoModo`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎮 ¡A Jugar!

¡Disfruta FusionBots Arena! Si te gusta, deja una ⭐ en el repositorio.

---

*Creado con ❤️ - Un experimento de fusiones deportivas arcade*
