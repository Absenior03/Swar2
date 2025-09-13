import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as Tone from 'tone';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import ThemeSelector from './ThemeSelector';
import { createThemedSynth } from './soundEffects';

// --- API and WebSocket Service Functions ---
async function classifyCode(code: string): Promise<{ genre: string; confidence: number }> {
    const response = await fetch('http://127.0.0.1:8000/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error('Failed to classify code');
    return response.json();
}

// Musical synth types mapping
const synthTypes: { [key: string]: any } = {
    'Go-Concurrent': Tone.FMSynth,
    'Go-Systems': Tone.AMSynth,
    'JS-Async': Tone.PluckSynth,
    'JS-DOM': Tone.PolySynth,
    'JS-Functional': Tone.MembraneSynth,
    'Algorithmic-Logic': Tone.PolySynth,
    'default': Tone.PolySynth
};

// --- 3D Components ---
interface NodeVisualProps { 
    id: string; 
    type: string; 
    position: [number, number, number]; 
    duration: number; 
    nodeColors: {
        function: string;
        loop: string;
        conditional: string;
        default: string;
    };
}
const NodeVisual: React.FC<NodeVisualProps> = ({ id, type, position, duration, nodeColors }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const initialLifetime = useRef(duration * 1.5 + 0.5);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.visible = true;
            meshRef.current.userData.lifetime = initialLifetime.current;
        }
    }, [id]);

    useFrame((_, delta) => {
        if (!meshRef.current || !meshRef.current.visible) return;
        meshRef.current.userData.lifetime -= delta;
        const lifetime = meshRef.current.userData.lifetime;
        const opacity = THREE.MathUtils.lerp(0, 1, lifetime / initialLifetime.current);
        (meshRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;
        if (lifetime <= 0) meshRef.current.visible = false;
    });

    const geometry = type.includes('function') ? <sphereGeometry args={[0.6, 32, 32]} /> : type.includes('for') ? <torusGeometry args={[0.5, 0.15, 16, 100]} /> : type.includes('if') ? <boxGeometry args={[0.8, 0.8, 0.8]} /> : <icosahedronGeometry args={[0.5, 0]} />;
    
    const color = type.includes('function') ? nodeColors.function : 
                  type.includes('for') || type.includes('while') ? nodeColors.loop : 
                  type.includes('if') ? nodeColors.conditional : 
                  nodeColors.default;

    // **CRITICAL FIX**: The <primitive> tag was causing the renderer to crash.
    // This now correctly renders the geometry and material as children of the mesh.
    return (
        <mesh ref={meshRef} position={position}>
            {geometry}
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

const CameraAnimator = ({ effect, setEffect }: { effect: number; setEffect: (e: number) => void }) => {
    const { camera } = useThree();
    useFrame(() => {
        if (effect > 0) {
            camera.position.x += (Math.random() - 0.5) * effect * 0.3;
            camera.position.y += (Math.random() - 0.5) * effect * 0.3;
            setEffect(effect * 0.9);
        }
        camera.position.lerp(new THREE.Vector3(0, 0, 15), 0.05);
    });
    return null;
};

// --- Code Viewer with Pointer ---
const CodeViewer = ({ code, highlightedLines }: { code: string; highlightedLines: { start: number, end: number } | null }) => {
    return (
        <pre className="code-container">
            {code.split('\n').map((line, index) => {
                const isHighlighted = highlightedLines && (index + 1 >= highlightedLines.start && index + 1 <= highlightedLines.end);
                return (
                    <div key={index} className={`code-line ${isHighlighted ? 'highlighted-line' : ''}`}>
                        <span className="line-number">{index + 1}</span>
                        <span>{line}</span>
                    </div>
                );
            })}
        </pre>
    );
};

// Helper function to get theme key
const getThemeKey = (themeName: string): string => {
    return themeName === 'Harry Potter' ? 'harryPotter' : 
           themeName === 'Stranger Things' ? 'strangerThings' :
           themeName === 'Marvel' ? 'marvel' :
           themeName === 'Disney' ? 'disney' : 'default';
};

// --- Main App Component ---
export default function App() {
    const { theme } = useTheme();
    const [code, setCode] = useState("function factorial(n) {\n  if (n === 0) {\n    return 1;\n  } else {\n    let result = 1;\n    for (let i = 1; i <= n; i++) {\n      result *= i;\n    }\n    return result;\n  }\n}");
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState('Ready. Paste your code and press Play.');
    const [visualNodes, setVisualNodes] = useState<NodeVisualProps[]>([]);
    const [cameraEffect, setCameraEffect] = useState(0);
    const [activePalette, setActivePalette] = useState('default');
    const [highlightedLines, setHighlightedLines] = useState<{ start: number, end: number } | null>(null);
    
    const ws = useRef<WebSocket | null>(null);
    const synth = useRef<any>(null);
    const sequence = useRef<Tone.Sequence | null>(null);
    const currentThemeRef = useRef<string>(getThemeKey(theme.name));

    // Function to create synth with current theme
    const createCurrentSynth = useCallback((paletteKey: string) => {
        const themeKey = getThemeKey(theme.name);
        currentThemeRef.current = themeKey;
        
        if (synth.current) synth.current.dispose();
        synth.current = createThemedSynth(themeKey, paletteKey);
        
        return synth.current;
    }, [theme.name]);

    const stopMusic = useCallback(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (sequence.current) sequence.current.dispose();
        setIsPlaying(false);
        setHighlightedLines(null);
        setStatus('Ready to play again.');
    }, []);

    const handlePlay = useCallback(async () => {
        if (isPlaying) {
            ws.current?.close();
            return;
        }

        if (Tone.context.state !== 'running') await Tone.start();

        try {
            setIsPlaying(true);
            setVisualNodes([]);
            setStatus('1/3: Classifying code...');
            
            const classification = await classifyCode(code);
            const paletteKey = classification.genre in theme.musicPalettes ? classification.genre : 'default';
            setActivePalette(paletteKey);
            const palette = theme.musicPalettes[paletteKey];
            
            createCurrentSynth(paletteKey);
            
            setStatus('2/3: Analyzing code structure...');
            const musicalEvents: { note: string | string[], duration: string, type: string, startLine: number, endLine: number }[] = [];
            let messageCounter = 0;

            ws.current = new WebSocket('ws://127.0.0.1:8000/ws/visualizer');
            ws.current.onopen = () => ws.current?.send(JSON.stringify({ code }));

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const currentScale = palette.scale;
                
                let note: string | string[];
                let duration: string;
                const noteIndex = Math.abs(data.startLine + messageCounter);

                switch (data.type) {
                    case 'function_declaration': case 'arrow_function':
                        note = [currentScale[noteIndex % currentScale.length], currentScale[(noteIndex + 3) % currentScale.length]];
                        duration = '4n'; break;
                    case 'for_statement': case 'while_statement':
                        note = currentScale[noteIndex % currentScale.length];
                        duration = '8n'; break;
                    case 'if_statement':
                        note = currentScale[noteIndex % currentScale.length];
                        duration = '8n'; break;
                    default:
                        if (data.type.length < 5 || data.type.includes("comment")) return;
                        note = currentScale[noteIndex % currentScale.length];
                        duration = '16n'; break;
                }
                
                messageCounter++;
                musicalEvents.push({ note, duration, ...data });
            };

            ws.current.onclose = () => {
                if (musicalEvents.length === 0) {
                    setStatus('No parsable musical elements found.');
                    setIsPlaying(false);
                    return;
                }
                
                setStatus('3/3: Composing and playing music...');
                
                const scheduledEvents: { time: number, note: string | string[], duration: string, type: string, startLine: number, endLine: number }[] = [];
                let cumulativeTime = 0;
                musicalEvents.forEach(event => {
                    scheduledEvents.push({ time: cumulativeTime, ...event });
                    cumulativeTime += Tone.Time(event.duration).toSeconds();
                });

                sequence.current = new Tone.Sequence((time, event) => {
                    synth.current?.triggerAttackRelease(event.note, event.duration, time);
                    
                    Tone.Draw.schedule(() => {
                        setHighlightedLines({ start: event.startLine, end: event.endLine });
                        setCameraEffect(1.0);
                        const newNode: NodeVisualProps = {
                            id: `${time}-${Math.random()}`,
                            type: event.type,
                            position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
                            duration: Tone.Time(event.duration).toSeconds(),
                            nodeColors: theme.visualEffects.nodeColors,
                        };
                        setVisualNodes(prev => [...prev.slice(-30), newNode]);
                    }, time);
                }, scheduledEvents).start(0);

                sequence.current.loop = false;
                Tone.Transport.start();

                setTimeout(stopMusic, (cumulativeTime + 2) * 1000);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('Error connecting to visualizer.');
                stopMusic();
            };
        } catch (error) {
            console.error('Failed to start visualization:', error);
            setStatus('Error connecting to backend.');
            stopMusic();
        }
    }, [code, isPlaying, stopMusic, theme.musicPalettes, createCurrentSynth]);

    // Update synth when theme changes (only if we already have a synth)
    useEffect(() => {
        const themeKey = getThemeKey(theme.name);
        
        // Only update if theme actually changed and we already have a synth created
        if (currentThemeRef.current !== themeKey && synth.current && activePalette) {
            createCurrentSynth(activePalette);
            console.log(`Synth updated to ${themeKey} theme with ${activePalette} palette`);
        }
    }, [theme.name, activePalette, createCurrentSynth]);

    useEffect(() => {
        return () => { 
           stopMusic();
           ws.current?.close();
           if (synth.current) synth.current.dispose();
        }
    }, [stopMusic]);

    return (
        <div className="App" data-theme={getThemeKey(theme.name)}>
            <header>
                <div className="header-content">
                    <h1>Project Swar</h1>
                    <p>Real-Time Code Sonification & Visualization</p>
                </div>
                <ThemeSelector />
            </header>
            <main>
                <div className="editor-container">
                    {isPlaying ? (
                        <CodeViewer code={code} highlightedLines={highlightedLines} />
                    ) : (
                        <textarea
                            className="code-container"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={isPlaying}
                        />
                    )}
                    <button onClick={handlePlay} disabled={!code.trim()}>
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                </div>
                <div className="visualizer-container">
                    <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
                        <ambientLight intensity={0.2} /><pointLight position={[10, 10, 10]} intensity={1.5} />
                        <Stars 
                            radius={100} 
                            depth={50} 
                            count={5000} 
                            factor={4} 
                            saturation={theme.visualEffects.starSaturation} 
                            fade 
                            speed={1} 
                        />
                        {visualNodes.map(node => <NodeVisual key={node.id} {...node} />)}
                        {!isPlaying && (
                            <Text 
                                position={[0, 0, 0]} 
                                fontSize={0.8} 
                                color={theme.colors.textSecondary} 
                                anchorX="center" 
                                anchorY="middle" 
                                outlineColor={theme.colors.background} 
                                outlineWidth={0.05}
                            >
                                Press Play to Visualize
                            </Text>
                        )}
                        <CameraAnimator effect={cameraEffect} setEffect={setCameraEffect} />
                    </Canvas>
                </div>
            </main>
            <footer>Status: {status} | Musical Palette: {activePalette}</footer>
        </div>
    );
}