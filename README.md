# 🤖 Robot Arena Mutante

Un juego competitivo 2D arcade para 2 jugadores locales, inspirado en Brawl Stars pero simplificado para Game Jam. El modo de juego cambia automáticamente cada 60 segundos, manteniendo la acción fresca y emocionante.

![Robot Arena Mutante](https://img.shields.io/badge/Phaser-3.60.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Platform](https://img.shields.io/badge/Platform-GitHub%20Pages-orange)

## 📸 Screenshots

![Gameplay](https://github.com/user-attachments/assets/1f18395e-bd21-428c-834a-22a5a9ea63c8)

*Vista del juego en Modo Posesión - Dos jugadores compiten por mantener el balón*

## 🎮 Características

- **Multijugador local**: 2 jugadores en el mismo teclado
- **5 modos de juego** que cambian automáticamente cada 60 segundos
- **Físicas arcade** suaves y responsivas
- **Vista top-down** 2D simple y clara
- **Sin servidor requerido**: 100% frontend, perfecto para GitHub Pages

## 🕹️ Controles

| Jugador | Movimiento | Empujar |
|---------|------------|---------|
| **Jugador 1** | W A S D | F |
| **Jugador 2** | Flechas | Shift |

## 🎯 Modos de Juego

### 1️⃣ Modo Gol ⚽
Anota en la portería rival. Cada gol suma un punto. ¡El jugador con más goles al final gana!

### 2️⃣ Modo Posesión 🏃
Mantén el balón cerca de ti. El tiempo que pases en contacto con el balón se convierte en puntos.

### 3️⃣ Modo Combate 💥
No hay balón. Empuja al rival contra las paredes para ganar puntos. ¡Cada impacto fuerte cuenta!

### 4️⃣ Modo Zona Segura 🟢
Hay una zona verde en el centro. ¡Mantente dentro! Fuera de ella pierdes puntos progresivamente.

### 5️⃣ Modo Empujón Extremo 🚀
Los bordes del mapa están abiertos. ¡Empuja al rival fuera del mapa para ganar puntos!

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
2. Abre `index.html` en tu navegador
   - O usa un servidor local: `python -m http.server 8080`
   - Luego visita `http://localhost:8080`

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
┌─────────────────────────────────────────────────┐
│                 GAME_CONFIG                      │
│  (Configuración global: velocidades, tamaños)    │
├─────────────────────────────────────────────────┤
│                   COLORS                         │
│  (Paleta de colores del juego)                   │
├─────────────────────────────────────────────────┤
│                 Clase Player                     │
│  - Movimiento 8 direcciones                      │
│  - Sistema de empuje con cooldown                │
│  - Puntuación individual                         │
├─────────────────────────────────────────────────┤
│                  Clase Ball                      │
│  - Física de rebote                              │
│  - Interacción con jugadores                     │
├─────────────────────────────────────────────────┤
│             Clase GameMode (Base)                │
│  - start(), update(), end()                      │
│  - checkWinCondition()                           │
├─────────────────────────────────────────────────┤
│            Modos Específicos                     │
│  - GoalMode                                      │
│  - PossessionMode                                │
│  - CombatMode                                    │
│  - SafeZoneMode                                  │
│  - ExtremePushMode                               │
├─────────────────────────────────────────────────┤
│             GameModeManager                      │
│  - Temporizador 60 segundos                      │
│  - Selección aleatoria sin repetir               │
│  - Transiciones entre modos                      │
├─────────────────────────────────────────────────┤
│                UIManager                         │
│  - Puntuaciones                                  │
│  - Timer                                         │
│  - Mensajes y transiciones                       │
├─────────────────────────────────────────────────┤
│                GameScene                         │
│  - Escena principal de Phaser                    │
│  - Coordina todos los sistemas                   │
├─────────────────────────────────────────────────┤
│             Configuración Phaser                 │
│  - Arcade Physics                                │
│  - Inicialización del juego                      │
└─────────────────────────────────────────────────┘
```

## 🎨 Stack Tecnológico

- **JavaScript ES6+**: Sin transpilación necesaria
- **HTML5 Canvas**: Renderizado 2D
- **Phaser 3**: Framework de juegos (CDN)
- **CSS3**: Estilos básicos

## 📋 Requisitos Técnicos

- Navegador moderno con soporte ES6
- No requiere servidor backend
- No requiere build tools
- Funciona offline (después de cargar)

## 🗺️ Roadmap de Mejoras Futuras

### Fase 1: Polish Visual 🎨
- [ ] Animaciones de personajes
- [ ] Sprites personalizados
- [ ] Efectos de partículas
- [ ] Mejores transiciones

### Fase 2: Audio 🔊
- [ ] Efectos de sonido
- [ ] Música de fondo
- [ ] Sonidos de UI

### Fase 3: Contenido ➕
- [ ] Más modos de juego:
  - [ ] Modo Captura la Bandera
  - [ ] Modo Rey de la Colina
  - [ ] Modo Carrera
  - [ ] Modo Supervivencia
- [ ] Power-ups
- [ ] Diferentes arenas/mapas

### Fase 4: Jugabilidad 🎮
- [ ] IA básica para modo un jugador
- [ ] Sistema de torneo
- [ ] Selección de personajes
- [ ] Habilidades especiales

### Fase 5: UI/UX 📱
- [ ] Pantalla de menú principal
- [ ] Pantalla de pausa
- [ ] Configuración de controles
- [ ] Soporte para gamepads
- [ ] Responsive design

### Fase 6: Técnico ⚙️
- [ ] Mejores físicas
- [ ] Balanceo de modos
- [ ] Optimización de rendimiento
- [ ] Guardar estadísticas locales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/NuevoModo`)
3. Commit tus cambios (`git commit -m 'Agrega nuevo modo de juego'`)
4. Push a la rama (`git push origin feature/NuevoModo`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🎮 ¡A Jugar!

¡Disfruta Robot Arena Mutante! Si te gusta, deja una ⭐ en el repositorio.

---

*Creado con ❤️ para Game Jam 2026*
