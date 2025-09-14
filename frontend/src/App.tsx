import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as Tone from 'tone';
import * as THREE from 'three';

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

// --- Musical Palettes ---
const musicPalettes: { [key: string]: { scale: string[]; synth: any; } } = {
    'Go-Concurrent': { scale: ['C3', 'D#3', 'G3', 'G#3', 'C4', 'D#4', 'G4', 'G#4'], synth: Tone.FMSynth },
    'Go-Systems':    { scale: ['A2', 'B2', 'C3', 'E3', 'A3', 'B3', 'C4', 'E4'], synth: Tone.AMSynth },
    'JS-Async':      { scale: ['G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6'], synth: Tone.PluckSynth },
    'JS-DOM':        { scale: ['C4', 'E4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'], synth: Tone.PolySynth },
    'JS-Functional': { scale: ['D3', 'F3', 'A3', 'C4', 'E4', 'F4', 'A4', 'C5'], synth: Tone.MembraneSynth },
    'Algorithmic-Logic': { scale: ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5', 'D5'], synth: Tone.PolySynth },
    'default':       { scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], synth: Tone.PolySynth }
};

// --- 3D Components ---
interface NodeVisualProps { 
    id: string; 
    type: string; 
    position: [number, number, number]; 
    duration: number;
}

interface MusicalEvent {
    note: string | string[];
    duration: string;
    type: string;
    startLine: number;
    endLine: number;
    isError?: boolean;
    message?: string;
}

const NodeVisual: React.FC<NodeVisualProps & { isError?: boolean; message?: string }> = ({ id, type, position, duration, isError, message }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const textRef = useRef<THREE.Mesh>(null!);
    const initialLifetime = useRef(duration * (isError ? 3 : 1.5) + 0.5);

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
        
        // Rotate error nodes for emphasis
        if (isError && meshRef.current.visible) {
            meshRef.current.rotation.y += delta * 2;
            meshRef.current.rotation.x += delta;
        }
    });

    const getErrorGeometry = (errorType: string) => {
        switch(errorType) {
            case 'syntax_error':
                return <octahedronGeometry args={[0.8, 0]} />;
            case 'logical_error':
                return <dodecahedronGeometry args={[0.8, 0]} />;
            case 'best_practice':
                return <tetrahedronGeometry args={[0.8, 0]} />;
            default:
                return <octahedronGeometry args={[0.8, 0]} />;
        }
    };

    const geometry = isError ? 
        getErrorGeometry(type) : 
        type.includes('function') ? <sphereGeometry args={[0.6, 32, 32]} /> : 
        type.includes('for') ? <torusGeometry args={[0.5, 0.15, 16, 100]} /> : 
        type.includes('if') ? <boxGeometry args={[0.8, 0.8, 0.8]} /> : 
        <icosahedronGeometry args={[0.5, 0]} />;

    const color = isError ? 
        type === 'syntax_error' ? '#ff0000' : 
        type === 'logical_error' ? '#ff8c00' : 
        type === 'best_practice' ? '#ffd700' : '#ff0000' :
        type.includes('function') ? '#ff69b4' : 
        type.includes('for') ? '#00ffff' : 
        type.includes('if') ? '#ffff00' : '#9932cc';

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
const CodeViewer = ({ code, highlightedLines }: { 
    code: string; 
    highlightedLines: { start: number; end: number; isError?: boolean; message?: string; } | null 
}) => {
    return (
        <pre className="code-container">
            {code.split('\n').map((line, index) => {
                const isHighlighted = highlightedLines && (index + 1 >= highlightedLines.start && index + 1 <= highlightedLines.end);
                const isError = highlightedLines?.isError && isHighlighted;
                return (
                    <div 
                        key={index} 
                        className={`code-line ${isHighlighted ? 'highlighted-line' : ''} ${isError ? 'error-line' : ''}`}
                        title={isError && highlightedLines?.message ? highlightedLines.message : undefined}
                    >
                        <span className="line-number">{index + 1}</span>
                        <span>{line}</span>
                        {isError && highlightedLines?.message && (
                            <span className="error-message">{highlightedLines.message}</span>
                        )}
                    </div>
                );
            })}
        </pre>
    );
};

// --- Main App Component ---
export default function App() {
    const [code, setCode] = useState("function factorial(n) {\n  if (n === 0) {\n    return 1;\n  } else {\n    let result = 1;\n    for (let i = 1; i <= n; i++) {\n      result *= i;\n    }\n    return result;\n  }\n}");
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState('Ready. Paste your code and press Play.');
    const [visualNodes, setVisualNodes] = useState<NodeVisualProps[]>([]);
    const [cameraEffect, setCameraEffect] = useState(0);
    const [activePalette, setActivePalette] = useState('default');
    const [highlightedLines, setHighlightedLines] = useState<{ 
        start: number; 
        end: number; 
        isError?: boolean; 
        message?: string; 
    } | null>(null);
    
    const ws = useRef<WebSocket | null>(null);
    const synth = useRef<any>(null);
    const sequence = useRef<Tone.Sequence | null>(null);

    const playTimeoutRef = useRef<number | null>(null);
    
    const stopMusic = useCallback(() => {
        // Clear any pending timeouts
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }

        // Stop and cleanup Tone.js
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        // Stop and dispose of sequence
        if (sequence.current) {
            sequence.current.stop();
            sequence.current.dispose();
            sequence.current = null;
        }
        
        // Release all notes and dispose of synth properly
        if (synth.current) {
            synth.current.releaseAll();
            synth.current.dispose();
            synth.current = null;
        }
        
        // Close WebSocket connection
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
            ws.current = null;
        }

        setIsPlaying(false);
        setHighlightedLines(null);
        setStatus('Ready to play again.');
        setVisualNodes([]); // Clear visualizations
        setCameraEffect(0); // Reset camera
    }, []);

    const handlePlay = useCallback(async (): Promise<void> => {
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
            const paletteKey = classification.genre in musicPalettes ? classification.genre : 'default';
            setActivePalette(paletteKey);
            const palette = musicPalettes[paletteKey];
            
            if (synth.current) synth.current.dispose();
            // Initialize synth based on the palette
            synth.current = new palette.synth({
                volume: -6,
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.5
                }
            }).toDestination();
            
            setStatus('2/3: Analyzing code structure...');
            const musicalEvents: MusicalEvent[] = [];
            let messageCounter = 0;

            ws.current = new WebSocket('ws://127.0.0.1:8000/ws/visualizer');
            ws.current.onopen = () => ws.current?.send(JSON.stringify({ code }));

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const currentScale = palette.scale;
                
                // Skip if not a valid syntax node
                // Handle error events from the backend
                if (data.isError) {
                    console.log('Received error event:', data);
                    const errorEvent = {
                        note: data.note || 'C2', // Fallback to C2 if no note specified
                        duration: data.duration || '8n',
                        type: data.type,
                        startLine: data.line,
                        endLine: data.line,
                        isError: true,
                        message: data.message
                    };
                    console.log('Created error event:', errorEvent);
                    musicalEvents.push(errorEvent);
                    
                    // Immediately show the error in the UI
                    setHighlightedLines({
                        start: data.line,
                        end: data.line,
                        isError: true,
                        message: data.message
                    });
                    setStatus(`Error detected: ${data.message}`);
                    return;
                }

                if (!data.type || !data.startLine || !data.endLine) return;
                
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
                musicalEvents.push({ 
                    note, 
                    duration, 
                    type: data.type,
                    startLine: data.startLine,
                    endLine: data.endLine
                });
            };
            if (ws.current) ws.current.onclose = () => {
                if (musicalEvents.length === 0) {
                    setStatus('No parsable musical elements found.');
                    setIsPlaying(false);
                    return;
                }
                
                setStatus('3/3: Composing and playing music...');

                // Reset transport
                Tone.Transport.stop();
                Tone.Transport.cancel();
                
                // Create a sequence with proper timing
                sequence.current = new Tone.Sequence(
                    (time, event) => {
                        if (!event || !synth.current) return;
                        
                        if (event.isError) {
                            // Temporarily reduce main synth volume
                            const originalVolume = synth.current.volume.value;
                            synth.current.volume.value = -25;  // Significantly reduce main sound
                            
                            // Create a prominent error sound
                            const errorSynth = new Tone.PolySynth(Tone.Synth, {
                                volume: 0,  // Full volume for error sound
                                envelope: {
                                    attack: 0.01,
                                    decay: 0.3,
                                    sustain: 0.6,
                                    release: 0.5
                                }
                            }).toDestination();
                            
                            // Add distortion for more prominence
                            const distortion = new Tone.Distortion(0.5).toDestination();
                            errorSynth.connect(distortion);
                            
                            // Play both normal and error sounds
                            synth.current.triggerAttackRelease(event.note, event.duration, time);
                            
                            // Play error sound (higher octave for emphasis)
                            const errorNote = Array.isArray(event.note) ? event.note[0] : event.note;
                            const baseFreq = Tone.Frequency(errorNote).toFrequency();
                            errorSynth.triggerAttackRelease(
                                [baseFreq * 2, baseFreq * 3], // Octave up + fifth
                                "8n",
                                time
                            );
                            
                            // Schedule cleanup and volume restoration
                            Tone.Transport.schedule(() => {
                                synth.current.volume.value = originalVolume;
                                errorSynth.dispose();
                                distortion.dispose();
                            }, `+${time + 0.5}`);
                        } else {
                            // Play regular sound at normal volume
                            synth.current.triggerAttackRelease(event.note, event.duration, time);
                        }
                        
                        // Schedule visual updates
                        Tone.Draw.schedule(() => {
                            if (event.startLine && event.endLine) {
                                setHighlightedLines({ start: event.startLine, end: event.endLine });
                                
                                // If it's an error, show the message in the status
                                if (event.isError && event.message) {
                                    setStatus(`Error at line ${event.startLine}: ${event.message}`);
                                }
                            }
                            setCameraEffect(event.isError ? 2.0 : 1.0);
                            
                            const newNode: NodeVisualProps & { isError?: boolean; message?: string } = {
                                id: `${time}-${Math.random()}`,
                                type: event.type,
                                position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
                                duration: Tone.Time(event.duration).toSeconds(),
                                isError: event.isError,
                                message: event.message
                            };
                            setVisualNodes(prev => [...prev.slice(-30), newNode]);
                        }, time);
                    },
                    musicalEvents,
                    '8n'
                ).start(0);

                // Don't loop
                sequence.current.loop = false;
                
                // Start transport and schedule stop
                Tone.Transport.start();
                const totalDuration = musicalEvents.length * Tone.Time('8n').toSeconds();
                Tone.Transport.schedule(() => {
                    stopMusic();
                }, `+${totalDuration + 1}`);

                // Transport control handled by direct note triggering
            };

            if (ws.current) ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('Error connecting to visualizer.');
                stopMusic();
            };
        } catch (error) {
            console.error('Failed to start visualization:', error);
            setStatus('Error connecting to backend.');
            stopMusic();
        }
    }, [code, isPlaying, stopMusic]);

    useEffect(() => {
        return () => { 
           stopMusic();
           ws.current?.close();
        }
    }, [stopMusic]);

    return (
        <div className="App">
            <header><h1>Swarr</h1><p>Real-Time Code Sonification & Visualization</p></header>
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
                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                        {visualNodes.map(node => <NodeVisual key={node.id} {...node} />)}
                        {!isPlaying && (
                            <Text position={[0, 0, 0]} fontSize={0.8} color="#555" anchorX="center" anchorY="middle" outlineColor="#000" outlineWidth={0.05}>
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

