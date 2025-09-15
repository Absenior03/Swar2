import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import * as Tone from 'tone';
import * as THREE from 'three';
import { useTheme } from './ThemeContext';
import ThemeSelector from './ThemeSelector';
import { createThemedSynth } from './soundEffects';
import './error-visualization.css';

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
        error?: string;
    };
    isError?: boolean;
    errorType?: string;
    severity?: number;
    message?: string;
    line?: number;
}

const NodeVisual: React.FC<NodeVisualProps> = ({ 
    id, type, position, duration, nodeColors, isError, errorType, severity, message, line 
}) => {
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
        
        // Add pulsing animation for errors
        if (isError && lifetime > 0) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 1;
            meshRef.current.scale.setScalar(pulse);
            
            // Rotate error nodes to make them more noticeable
            meshRef.current.rotation.x += delta * 2;
            meshRef.current.rotation.y += delta * 1.5;
        }
        
        if (lifetime <= 0) meshRef.current.visible = false;
    });

    // Enhanced geometries based on error type and severity
    let geometry;
    let color;
    let scale = 1;

    if (isError) {
        // Different shapes for different error types
        switch (errorType) {
            case 'syntax_error':
                geometry = <coneGeometry args={[0.8, 1.5, 8]} />; // Sharp cone for syntax errors
                color = "#ff4757"; // Bright red
                scale = 1.2;
                break;
            case 'logical_error':
                geometry = <octahedronGeometry args={[0.9, 0]} />; // Octahedron for logical errors
                color = "#ffa502"; // Orange
                scale = 1.1;
                break;
            case 'runtime_error':
                geometry = <tetrahedronGeometry args={[1.0, 0]} />; // Tetrahedron for runtime errors
                color = "#ff3838"; // Darker red
                scale = 1.3;
                break;
            case 'best_practice':
                geometry = <dodecahedronGeometry args={[0.6, 0]} />; // Dodecahedron for best practices
                color = "#ffb8b8"; // Light red/pink
                scale = 0.9;
                break;
            default:
                geometry = <octahedronGeometry args={[0.7, 0]} />;
                color = "#ff4757";
        }
        
        // Adjust intensity based on severity
        if (severity && severity >= 3) {
            scale *= 1.2;
            color = "#ff1744"; // Even brighter red for high severity
        }
    } else {
        // Normal code element geometries
        if (type.includes('function')) {
            geometry = <sphereGeometry args={[0.6, 32, 32]} />;
            color = nodeColors.function;
        } else if (type.includes('for') || type.includes('while')) {
            geometry = <torusGeometry args={[0.5, 0.15, 16, 100]} />;
            color = nodeColors.loop;
        } else if (type.includes('if')) {
            geometry = <boxGeometry args={[0.8, 0.8, 0.8]} />;
            color = nodeColors.conditional;
        } else {
            geometry = <icosahedronGeometry args={[0.5, 0]} />;
            color = nodeColors.default;
        }
    }

    return (
        <mesh 
            ref={meshRef} 
            position={position} 
            rotation={[0, 0, 0]}
            scale={[scale, scale, scale]}
        >
            {geometry}
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isError ? 5 : 3}
                transparent
                opacity={isError ? 0.9 : 0.8}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                roughness={isError ? 0.1 : 0.5}
                metalness={isError ? 0.8 : 0.2}
            />
            {/* Add wireframe overlay for errors */}
            {isError && (
                <mesh>
                    {geometry}
                    <meshBasicMaterial
                        color={color}
                        wireframe
                        transparent
                        opacity={0.6}
                    />
                </mesh>
            )}
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

// --- Enhanced Code Viewer with Error Indicators ---
interface ErrorInfo {
    line: number;
    type: string;
    message: string;
    severity: number;
}

const CodeViewer = ({ 
    code, 
    highlightedLines, 
    errorMessage, 
    currentErrorType,
    allErrors = []
}: { 
    code: string; 
    highlightedLines: { start: number, end: number } | null; 
    errorMessage?: string;
    currentErrorType?: string;
    allErrors?: ErrorInfo[];
}) => {
    const getErrorForLine = (lineNum: number) => {
        return allErrors.find(error => error.line === lineNum);
    };

    const getErrorTypeClass = (errorType: string) => {
        switch (errorType) {
            case 'syntax_error': return 'error-syntax';
            case 'logical_error': return 'error-logical';
            case 'runtime_error': return 'error-runtime';
            case 'best_practice': return 'error-practice';
            default: return 'error-generic';
        }
    };

    const getErrorIcon = (errorType: string) => {
        switch (errorType) {
            case 'syntax_error': return '🔴';
            case 'logical_error': return '🟡';
            case 'runtime_error': return '🔥';
            case 'best_practice': return '🔵';
            default: return '⚠️';
        }
    };

    return (
        <div className="code-viewer-container">
            <pre className="code-container">
                {code.split('\n').map((line, index) => {
                    const lineNum = index + 1;
                    const isHighlighted = highlightedLines && (lineNum >= highlightedLines.start && lineNum <= highlightedLines.end);
                    const lineError = getErrorForLine(lineNum);
                    const hasError = !!lineError;
                    
                    return (
                        <div 
                            key={index} 
                            className={`code-line ${isHighlighted ? 'highlighted-line' : ''} ${
                                hasError ? getErrorTypeClass(lineError.type) : ''
                            }`}
                        >
                            <span className="line-number">{lineNum}</span>
                            {hasError && (
                                <span className="error-icon" title={`${lineError.type}: ${lineError.message}`}>
                                    {getErrorIcon(lineError.type)}
                                </span>
                            )}
                            <span className="code-text">{line}</span>
                            {isHighlighted && errorMessage && (
                                <span className={`error-message ${getErrorTypeClass(currentErrorType || '')}`}>
                                    // {errorMessage}
                                </span>
                            )}
                            {hasError && !isHighlighted && (
                                <span className={`static-error-message ${getErrorTypeClass(lineError.type)}`}>
                                    // {lineError.message}
                                </span>
                            )}
                        </div>
                    );
                })}
            </pre>
            
            {/* Error Summary Panel */}
            {allErrors.length > 0 && (
                <div className="error-summary">
                    <h4>🚨 Code Issues ({allErrors.length})</h4>
                    {allErrors.map((error, idx) => (
                        <div key={idx} className={`error-item ${getErrorTypeClass(error.type)}`}>
                            <span className="error-icon">{getErrorIcon(error.type)}</span>
                            <span className="error-line">Line {error.line}:</span>
                            <span className="error-text">{error.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper to normalize theme keys
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
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const [currentErrorType, setCurrentErrorType] = useState<string | undefined>(undefined);
    const [allErrors, setAllErrors] = useState<ErrorInfo[]>([]);

    const ws = useRef<WebSocket | null>(null);
    const synth = useRef<any>(null);
    const sequence = useRef<Tone.Sequence | null>(null);
    const currentThemeRef = useRef<string>(getThemeKey(theme.name));

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
        setErrorMessage(undefined);
        setCurrentErrorType(undefined);
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
            const musicalEvents: { 
                note: string | string[], 
                duration: string, 
                type: string, 
                startLine: number, 
                endLine: number, 
                isError?: boolean, 
                errorType?: string,
                severity?: number,
                message?: string 
            }[] = [];
            let messageCounter = 0;
            const collectedErrors: ErrorInfo[] = [];

            ws.current = new WebSocket('ws://127.0.0.1:8000/ws/visualizer');
            ws.current.onopen = () => ws.current?.send(JSON.stringify({ code }));

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const currentScale = palette.scale;
                let note: string | string[];
                let duration: string;
                const noteIndex = Math.abs(data.startLine + messageCounter);

                if (data.isError) {
                    // Collect error for display
                    collectedErrors.push({
                        line: data.line,
                        type: data.type,
                        message: data.message,
                        severity: data.severity || 1
                    });

                    // Map error type to specific notes
                    switch (data.type) {
                        case 'syntax_error':
                            note = "C2";
                            duration = "4n";
                            break;
                        case 'logical_error':
                            note = "E3";
                            duration = "8n";
                            break;
                        case 'runtime_error':
                            note = "D2";
                            duration = "4n";
                            break;
                        case 'best_practice':
                            note = "A4";
                            duration = "16n";
                            break;
                        default:
                            note = "C2";
                            duration = "8n";
                    }
                    
                    musicalEvents.push({ 
                        note, 
                        duration, 
                        ...data, 
                        isError: true, 
                        errorType: data.type,
                        severity: data.severity,
                        message: data.message 
                    });
                } else {
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
                }
            };

            ws.current.onclose = () => {
                // Set collected errors for display
                setAllErrors(collectedErrors);
                
                if (musicalEvents.length === 0) {
                    setStatus('No parsable musical elements found.');
                    setIsPlaying(false);
                    return;
                }

                setStatus('3/3: Composing and playing music...');

                const scheduledEvents: any[] = [];
                let cumulativeTime = 0;
                musicalEvents.forEach(event => {
                    scheduledEvents.push({ time: cumulativeTime, ...event });
                    cumulativeTime += Tone.Time(event.duration).toSeconds();
                });

                sequence.current = new Tone.Sequence((time, event: any) => {
                    if (event.isError) {
                        // Create specialized error synths based on error type
                        let errorSynth;
                        switch (event.errorType) {
                            case 'syntax_error':
                                errorSynth = new Tone.MonoSynth({
                                    oscillator: { type: "sawtooth" },
                                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.7 },
                                }).toDestination();
                                break;
                            case 'logical_error':
                                errorSynth = new Tone.MonoSynth({
                                    oscillator: { type: "square" },
                                    envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.5 },
                                }).toDestination();
                                break;
                            case 'runtime_error':
                                errorSynth = new Tone.MonoSynth({
                                    oscillator: { type: "triangle" },
                                    envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.8 },
                                }).toDestination();
                                break;
                            default:
                                errorSynth = new Tone.MonoSynth({
                                    oscillator: { type: "sine" },
                                    envelope: { attack: 0.05, decay: 0.1, sustain: 0.2, release: 0.3 },
                                }).toDestination();
                        }
                        
                        errorSynth.triggerAttackRelease(event.note, event.duration, time);
                        setErrorMessage(event.message);
                        setCurrentErrorType(event.errorType);
                    } else {
                        synth.current?.triggerAttackRelease(event.note, event.duration, time);
                        setErrorMessage(undefined);
                        setCurrentErrorType(undefined);
                    }

                    Tone.Draw.schedule(() => {
                        setHighlightedLines({ start: event.startLine, end: event.endLine });
                        setCameraEffect(event.isError ? 2.0 : 1.0); // Stronger camera shake for errors
                        const newNode: NodeVisualProps = {
                            id: `${time}-${Math.random()}`,
                            type: event.type,
                            position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10],
                            duration: Tone.Time(event.duration).toSeconds(),
                            nodeColors: theme.visualEffects.nodeColors,
                            isError: event.isError,
                            errorType: event.errorType,
                            severity: event.severity,
                            message: event.message,
                            line: event.line,
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

    useEffect(() => {
        const themeKey = getThemeKey(theme.name);
        if (currentThemeRef.current !== themeKey && synth.current && activePalette) {
            createCurrentSynth(activePalette);
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
                    <h1>Swarr</h1>
                    <p>Real-Time Code Sonification & Visualization</p>
                </div>
                <ThemeSelector />
            </header>
            <main>
                <div className="editor-container">
                    {isPlaying ? (
                        <CodeViewer 
                            code={code} 
                            highlightedLines={highlightedLines} 
                            errorMessage={errorMessage}
                            currentErrorType={currentErrorType}
                            allErrors={allErrors}
                        />
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
                    {/* Error Indicator Overlay */}
                    {allErrors.length > 0 && (
                        <div className="error-indicator-overlay">
                            <div className="error-counter">
                                🚨 {allErrors.length} Issues Found
                            </div>
                            <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>
                                {allErrors.filter(e => e.type === 'syntax_error').length > 0 && '🔴 Syntax '}
                                {allErrors.filter(e => e.type === 'logical_error').length > 0 && '🟡 Logic '}
                                {allErrors.filter(e => e.type === 'runtime_error').length > 0 && '🔥 Runtime '}
                                {allErrors.filter(e => e.type === 'best_practice').length > 0 && '🔵 Style '}
                            </div>
                        </div>
                    )}
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
