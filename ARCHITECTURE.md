# 90s Winamp Visualizer - Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    90s WINAMP VISUALIZER ARCHITECTURE                     ║
║                    « The Code Never Dies, It Just Loops »                ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## System Overview

A Three.js-based music visualizer system recreating the authentic 90s Winamp/Windows Media Player experience with modern web technologies.

## Architecture Diagrams

### 1. Component Hierarchy (Flowchart)

```mermaid
flowchart TB
    subgraph App["📻 WinampVisualizerApp"]
        direction TB
        
        subgraph Core["🔧 Core Systems"]
            AudioEngine["AudioEngine\n&lt;Web Audio API&gt;"]
            ThemeManager["ThemeManager\n&lt;Theme System&gt;"]
            ConfigManager["ConfigManager\n&lt;Settings&gt;"]
        end
        
        subgraph Visualizers["🎨 Visualizer Manager"]
            VM["VisualizerManager\n&lt;Active Visualizer&gt;"]
            
            subgraph Implementations["Visualizer Implementations"]
                Spectrum["SpectrumAnalyzer\nFFT Bars"]
                Oscilloscope["Oscilloscope\nWaveform"]
                Milkdrop["MilkdropRenderer\nBeat-reactive"]
                VUMeter["VUMeter\nPeak/RMS"]
            end
        end
        
        subgraph UI["🖥️ User Interface"]
            MainWindow["MainWindow\n&lt;CRT Container&gt;"]
            TitleBar["TitleBar\n&lt;Draggable&gt;"]
            Controls["ControlPanel\n&lt;Play/Pause/Stop&gt;"]
            VisualizerSelector["VisualizerSelector\n&lt;Tab/Buttons&gt;"]
            Playlist["PlaylistPanel\n&lt;Track List&gt;"]
            StatusBar["StatusBar\n&lt;Info/Time&gt;"]
        end
        
        subgraph Render["🎬 Rendering Pipeline"]
            Renderer["WebGLRenderer\n&lt;Three.js&gt;"]
            Scene["Scene\n&lt;3D Context&gt;"]
            PostProcess["PostProcess\n&lt;CRT Effects&gt;"]
        end
    end
    
    App --> Core
    App --> Visualizers
    App --> UI
    App --> Render
    
    AudioEngine --> VM
    VM --> Spectrum
    VM --> Oscilloscope
    VM --> Milkdrop
    VM --> VUMeter
    
    Spectrum --> Scene
    Oscilloscope --> Scene
    Milkdrop --> Scene
    VUMeter --> Scene
    
    Scene --> PostProcess
    PostProcess --> Renderer
    
    UI --> VM
    UI --> ThemeManager
    UI --> ConfigManager
    
    ThemeManager --> UI
    ThemeManager --> Visualizers
    
    ConfigManager --> AudioEngine
    ConfigManager --> ThemeManager
```

### 2. Class Hierarchy (Class Diagram)

```mermaid
classDiagram
    class BaseVisualizer {
        +string id
        +string name
        +VisualizerConfig config
        +Theme theme
        +AudioData audioData
        +Scene scene
        +boolean isActive
        +number fps
        +initialize() Promise~void~
        +update(audioData: AudioData) void
        +render(deltaTime: number) void
        +dispose() void
        +setTheme(theme: Theme) void
        #createGeometry() void
        #createMaterials() void
        #updateGeometry() void
        #updateShaders() void
    }
    
    class SpectrumAnalyzer {
        +number barCount
        +number[] frequencies
        +Mesh[] bars
        +ColorGradient gradient
        +FFTSize fftSize
        +setupFFT() void
        +processFrequencyData() void
        +updateBars() void
        +setGradient(colors: ColorGradient) void
    }
    
    class Oscilloscope {
        +number sampleRate
        +number timeWindow
        +BufferGeometry waveform
        +LineBasicMaterial material
        +number points
        +setupWaveform() void
        +processTimeDomainData() void
        +updateWaveform() void
        +setTimeWindow(ms: number) void
    }
    
    class MilkdropRenderer {
        +ShaderMaterial shader
        +RenderTarget renderTarget
        +BeatDetector beatDetector
        +PresetManager presets
        +number currentPreset
        +number beatIntensity
        +loadPreset(preset: Preset) void
        +detectBeat() boolean
        +transitionToPreset(index: number) void
        +updateUniforms() void
    }
    
    class VUMeter {
        +number channels
        +number peakHoldTime
        +number[] peakLevels
        +Mesh[] meters
        +Mesh[] peakIndicators
        +calculateRMS(data: Float32Array) number
        +calculatePeak(data: Float32Array) number
        +updateMeters() void
        +resetPeaks() void
    }
    
    class AudioEngine {
        +AudioContext context
        +AnalyserNode analyser
        +GainNode gain
        +AudioData audioData
        +boolean isPlaying
        +number sampleRate
        +initialize() Promise~void~
        +createSyntheticSource() void
        +getFrequencyData() Uint8Array
        +getTimeDomainData() Uint8Array
        +setFFTSize(size: number) void
        +play() void
        +pause() void
    }
    
    class AudioData {
        +Uint8Array frequencyData
        +Uint8Array timeDomainData
        +number sampleRate
        +number timestamp
        +Float32Array getFloatFrequencyData()
        +Float32Array getFloatTimeDomainData()
    }
    
    class Theme {
        +string id
        +string name
        +ColorPalette colors
        +Typography typography
        +UITheme ui
        +VisualizerTheme visualizers
        +CRTSettings crt
        +apply() void
    }
    
    class VisualizerManager {
        +BaseVisualizer[] visualizers
        +BaseVisualizer active
        +string currentId
        +register(visualizer: BaseVisualizer) void
        +activate(id: string) void
        +cycle() void
        +get(id: string) BaseVisualizer
    }
    
    class CRTShader {
        +ShaderMaterial material
        +number scanlineIntensity
        +number curvature
        +number vignette
        +number phosphorGlow
        +Color phosphorColor
        +updateUniforms(time: number) void
    }
    
    BaseVisualizer <|-- SpectrumAnalyzer
    BaseVisualizer <|-- Oscilloscope
    BaseVisualizer <|-- MilkdropRenderer
    BaseVisualizer <|-- VUMeter
    
    VisualizerManager --> BaseVisualizer
    AudioEngine --> AudioData
    Theme --> BaseVisualizer
    BaseVisualizer --> AudioData
    MilkdropRenderer --> CRTShader
```

### 3. Audio Processing Sequence (Sequence Diagram)

```mermaid
sequenceDiagram
    participant User
    participant UI as ControlPanel
    participant AE as AudioEngine
    participant VM as VisualizerManager
    participant BV as BaseVisualizer
    participant R as WebGLRenderer
    
    User->>UI: Click Play
    UI->>AE: play()
    activate AE
    
    alt Real Audio
        AE->>AE: Load audio file
        AE->>AE: Create AudioBufferSource
    else Demo Mode
        AE->>AE: Create OscillatorNode
        AE->>AE: Generate synthetic data
    end
    
    AE->>AE: Connect to AnalyserNode
    AE-->>UI: playback started
    
    loop Animation Frame (60fps)
        AE->>AE: getFrequencyData()
        AE->>AE: getTimeDomainData()
        AE->>VM: emit('audioData', AudioData)
        
        VM->>BV: update(audioData)
        activate BV
        
        alt Spectrum
            BV->>BV: processFrequencyData()
            BV->>BV: updateBarHeights()
        else Oscilloscope
            BV->>BV: processTimeDomainData()
            BV->>BV: updateWaveform()
        else Milkdrop
            BV->>BV: detectBeat()
            BV->>BV: updateShaderUniforms()
        end
        
        BV->>R: render(scene)
        deactivate BV
        
        R-->>VM: frame rendered
    end
    
    User->>UI: Click Stop
    UI->>AE: stop()
    AE->>AE: Disconnect nodes
    AE->>AE: Suspend context
    deactivate AE
```

### 4. Application State Machine (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> Initializing: Load App
    
    Initializing --> Loading: Initialize WebGL
    Initializing --> Error: WebGL Not Supported
    
    Loading --> Ready: Assets Loaded
    Loading --> Error: Load Failed
    
    Ready --> Playing: User Plays
    Ready --> Configuring: Open Settings
    
    Configuring --> Ready: Save & Close
    Configuring --> Loading: Change Theme
    
    Playing --> Paused: User Pauses
    Playing --> Stopped: User Stops
    Playing --> Configuring: Open Settings
    
    Paused --> Playing: User Resumes
    Paused --> Stopped: User Stops
    
    Stopped --> Playing: User Plays
    Stopped --> Ready: Reset
    
    Error --> Loading: Retry
    Error --> [*]: Exit
    
    note right of Playing
        Active animation loop
        Audio processing
        Visualizer updates
    end note
    
    note right of Paused
        Static display
        Audio suspended
    end note
```

### 5. Data Flow Architecture

```mermaid
flowchart LR
    subgraph Input["📥 Input Layer"]
        Audio[Audio Source]
        UserInput[User Input]
        Config[Configuration]
    end
    
    subgraph Processing["⚙️ Processing Layer"]
        AudioProc[AudioProcessor]
        FFT[FFT Analysis]
        Beat[Beat Detection]
        ThemeProc[Theme Processor]
    end
    
    subgraph Data["💾 Data Layer"]
        AudioData[(AudioData)]
        ThemeData[(Theme)]
        ConfigData[(Settings)]
    end
    
    subgraph Visualization["🎨 Visualization Layer"]
        Spectrum[Frequency Bars]
        Waveform[Oscilloscope]
        Particles[Milkdrop]
        VU[VU Meter]
    end
    
    subgraph Rendering["🖥️ Rendering Layer"]
        WebGL[WebGL Context]
        Shaders[GLSL Shaders]
        PostFX[Post-Processing]
        CRT[CRT Effects]
    end
    
    subgraph Output["📤 Output Layer"]
        Canvas[Canvas Element]
        UI[UI Components]
    end
    
    Audio --> AudioProc
    UserInput --> ConfigData
    Config --> ConfigData
    
    AudioProc --> FFT
    AudioProc --> Beat
    FFT --> AudioData
    Beat --> AudioData
    ThemeProc --> ThemeData
    
    AudioData --> Spectrum
    AudioData --> Waveform
    AudioData --> Particles
    AudioData --> VU
    
    ThemeData --> Visualization
    
    Spectrum --> WebGL
    Waveform --> WebGL
    Particles --> WebGL
    VU --> WebGL
    
    WebGL --> Shaders
    Shaders --> PostFX
    PostFX --> CRT
    
    CRT --> Canvas
    ConfigData --> UI
    ThemeData --> UI
```

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  WinampVisualizerApp                                          │
│  ├── Event Bus (Pub/Sub)                                     │
│  ├── State Manager                                           │
│  └── Plugin System                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    VISUALIZATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  VisualizerManager                                            │
│  ├── BaseVisualizer (Abstract)                               │
│  │   ├── SpectrumAnalyzer                                    │
│  │   ├── Oscilloscope                                        │
│  │   ├── MilkdropRenderer                                    │
│  │   └── VUMeter                                             │
│  └── PostProcessingPipeline                                  │
│      ├── CRT Shader                                          │
│      ├── Scanline Effect                                     │
│      └── Vignette + Glow                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AUDIO LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  AudioEngine                                                  │
│  ├── Web Audio API Context                                   │
│  ├── AnalyserNode (FFT)                                      │
│  ├── GainNode (Volume)                                       │
│  └── DemoGenerator (Synthetic)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      THEME LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  ThemeManager                                                 │
│  ├── Theme (Base)                                            │
│  │   ├── Color Palette                                       │
│  │   ├── Typography (Bitmap Fonts)                           │
│  │   ├── UI Components                                       │
│  │   └── Visualizer Settings                                 │
│  ├── CRT Settings                                            │
│  └── Animation Curves                                        │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app-winamp-viz/
├── src/
│   ├── core/
│   │   ├── AudioEngine.ts          # Web Audio API management
│   │   ├── EventBus.ts             # Pub/sub event system
│   │   ├── ConfigManager.ts        # Settings persistence
│   │   └── StateManager.ts         # App state management
│   ├── visualizers/
│   │   ├── BaseVisualizer.ts       # Abstract base class
│   │   ├── VisualizerManager.ts    # Visualizer coordinator
│   │   ├── SpectrumAnalyzer.ts     # FFT frequency bars
│   │   ├── Oscilloscope.ts         # Waveform display
│   │   ├── MilkdropRenderer.ts     # Particle/beat effects
│   │   └── VUMeter.ts              # Volume unit meter
│   ├── audio/
│   │   ├── AudioData.ts            # Data structures
│   │   ├── AudioProcessor.ts       # Processing utilities
│   │   ├── BeatDetector.ts         # Beat detection algo
│   │   └── DemoGenerator.ts        # Synthetic audio
│   ├── rendering/
│   │   ├── Renderer.ts             # Three.js setup
│   │   ├── SceneManager.ts         # Scene organization
│   │   ├── shaders/
│   │   │   ├── crt.frag            # CRT fragment shader
│   │   │   ├── scanlines.frag      # Scanline shader
│   │   │   ├── milkdrop.frag       # Milkdrop shaders
│   │   │   └── common.vert         # Common vertex shader
│   │   └── postprocessing/
│   │       ├── CRTEffect.ts        # CRT post-processor
│   │       └── ScanlineEffect.ts   # Scanline overlay
│   ├── themes/
│   │   ├── Theme.ts                # Theme base class
│   │   ├── ThemeManager.ts         # Theme coordinator
│   │   ├── presets/
│   │   │   ├── winamp-default.ts   # Classic Winamp
│   │   │   ├── wmp-classic.ts      # Windows Media Player
│   │   │   ├── terminal-green.ts   # Matrix style
│   │   │   └── cyber-90s.ts        # Cyberpunk 90s
│   │   └── types/
│   │       ├── ColorPalette.ts
│   │       ├── Typography.ts
│   │       └── UITheme.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── MainWindow.ts       # Main container
│   │   │   ├── TitleBar.ts         # Draggable header
│   │   │   ├── ControlPanel.ts     # Playback controls
│   │   │   ├── VisualizerSelector.ts
│   │   │   ├── PlaylistPanel.ts
│   │   │   ├── EqualizerPanel.ts
│   │   │   ├── StatusBar.ts
│   │   │   └── ContextMenu.ts
│   │   ├── styles/
│   │   │   ├── winamp.css          # 90s styling
│   │   │   └── crt.css             # CRT effects
│   │   └── utils/
│   │       ├── DragHandler.ts
│   │       └── BitmapFontLoader.ts
│   ├── types/
│   │   ├── index.ts                # Main exports
│   │   ├── audio.ts                # Audio types
│   │   ├── visualizer.ts           # Visualizer types
│   │   ├── theme.ts                # Theme types
│   │   └── config.ts               # Config types
│   ├── utils/
│   │   ├── math.ts                 # Math utilities
│   │   ├── color.ts                # Color utilities
│   │   ├── animation.ts            # Animation helpers
│   │   └── storage.ts              # Local storage
│   └── main.ts                     # Entry point
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   ├── webgl.ts
│   │   └── webaudio.ts
│   ├── unit/
│   │   ├── visualizers/
│   │   ├── audio/
│   │   └── ui/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── diagrams/
├── themes/
│   └── *.json                      # Custom theme files
├── public/
│   ├── fonts/                      # Bitmap fonts
│   ├── skins/                      # Skin images
│   └── shaders/                    # Shader files
├── index.html
├── vite.config.ts
├── vitest.config.ts
└── package.json
```

## Technology Stack

### Core Technologies
- **Three.js** - WebGL rendering engine
- **TypeScript** - Type-safe development
- **Web Audio API** - Audio processing
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework

### Supporting Libraries
- **GLSL** - Custom shaders for effects
- **WebGL 2.0** - Hardware acceleration
- **localStorage/IndexedDB** - Persistence
- **ResizeObserver** - Responsive layout

## Performance Architecture

```mermaid
flowchart TB
    subgraph Memory["🧠 Memory Management"]
        Pool["Object Pooling\nGeometry/Materials"]
        Dispose["Proper Disposal\nPrevent Leaks"]
        Reuse["Buffer Reuse\nAudio Data"]
    end
    
    subgraph Rendering["🎯 Rendering Optimizations"]
        Instancing["Geometry Instancing\nSpectrum Bars"]
        LOD["Level of Detail\nDistant Objects"]
        Culling["Frustum Culling\nHidden Objects"]
    end
    
    subgraph Audio["🔊 Audio Processing"]
        FFT["FFT Size: 2048\nBalance speed/quality"]
        Smooth["Smoothing: 0.8\nReduce jitter"]
        Throttle["Update: 30fps\nRender: 60fps"]
    end
    
    subgraph GPU["⚡ GPU Optimization"]
        Shaders["Efficient Shaders\nMinimize branching"]
        Uniforms["Batch Uniform Updates"]
        FBO["Render Targets\nOffscreen processing"]
    end
```

## Security Architecture

```mermaid
flowchart LR
    subgraph Security["🔒 Security Layers"]
        CSP["Content Security Policy\nNo inline scripts"]
        CORS["CORS Headers\nResource loading"]
        WebGL["WebGL Security\nContext limits"]
        Audio["Audio Context\nUser interaction required"]
    end
    
    subgraph Privacy["🔐 Privacy"]
        Local["Local Only\nNo external calls"]
        Storage["Encrypted Storage\nSensitive data"]
        Anonymous["Anonymous Usage\nNo tracking"]
    end
```

## Plugin Architecture (Future)

```
┌────────────────────────────────────────┐
│           Plugin System                 │
├────────────────────────────────────────┤
│  interface VisualizerPlugin {          │
│    id: string                          │
│    name: string                        │
│    version: string                     │
│                                        │
│    initialize(): Promise<void>        │
│    render(audioData: AudioData): void  │
│    dispose(): void                     │
│  }                                     │
└────────────────────────────────────────┘
```

## Key Design Decisions

### 1. **Audio Processing Strategy**
- **Decision**: Use Web Audio API AnalyserNode with configurable FFT size
- **Rationale**: Hardware-accelerated, consistent across browsers
- **Trade-off**: Fixed 2048 samples max, requires custom smoothing

### 2. **Rendering Strategy**
- **Decision**: Three.js with custom shaders for post-processing
- **Rationale**: Abstraction over raw WebGL, excellent documentation
- **Trade-off**: Bundle size (~150KB), but worth it for maintainability

### 3. **Theme System**
- **Decision**: JSON-based themes with runtime application
- **Rationale**: Easy to create/share, hot-reload capable
- **Trade-off**: Runtime parsing overhead, but negligible

### 4. **Demo Mode**
- **Decision**: Synthetic oscillator + noise generator
- **Rationale**: No CORS issues, works offline, consistent demo
- **Trade-off**: Not "real" audio, but sufficient for visualization

## Performance Budgets

| Metric | Target | Maximum |
|--------|--------|---------|
| Bundle Size | < 500KB | 800KB |
| First Paint | < 1s | 2s |
| Time to Interactive | < 2s | 3s |
| Frame Rate | 60fps | 30fps (minimum) |
| Memory Usage | < 100MB | 200MB |
| CPU Usage | < 30% | 50% |

## Browser Compatibility

```
Chrome  90+  ████████████████████  Full Support
Firefox 88+  ████████████████████  Full Support
Safari  14+  █████████████████░░░  WebGL2 limited
Edge    90+  ████████████████████  Full Support
```

## Next Steps

1. **Phase 1**: Core audio engine + Spectrum visualizer
2. **Phase 2**: Theme system + UI components
3. **Phase 3**: Additional visualizers (Oscilloscope, Milkdrop)
4. **Phase 4**: CRT effects + polish
5. **Phase 5**: Plugin system + extensibility

---

```
╔══════════════════════════════════════════════════════════════════╗
║  "Good architecture is like good music - the structure         ║
║   supports the art without getting in the way."                  ║
║                                          - Winamp Dev Team     ║
╚══════════════════════════════════════════════════════════════════╝
```
