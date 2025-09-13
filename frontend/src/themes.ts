// Theme configuration for Project Swar
export interface Theme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        accent: string;
        border: string;
        highlight: string;
        codeBackground: string;
    };
    fonts: {
        primary: string;
        code: string;
    };
    visualEffects: {
        starColor: string;
        starSaturation: number;
        nodeColors: {
            function: string;
            loop: string;
            conditional: string;
            default: string;
        };
    };
    musicPalettes: {
        [key: string]: {
            scale: string[];
            synth: any;
        };
    };
}

// Default Dark Theme
export const defaultTheme: Theme = {
    name: 'Default Dark',
    colors: {
        primary: '#646cff',
        secondary: '#535bf2',
        background: '#1a1a1a',
        surface: '#242424',
        text: 'rgba(255, 255, 255, 0.87)',
        textSecondary: '#888',
        accent: '#9932cc',
        border: '#333',
        highlight: 'rgba(94, 103, 255, 0.25)',
        codeBackground: '#161616',
    },
    fonts: {
        primary: "'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif",
        code: "'Fira Code', 'Courier New', monospace",
    },
    visualEffects: {
        starColor: '#ffffff',
        starSaturation: 0,
        nodeColors: {
            function: '#ff69b4',
            loop: '#00ffff',
            conditional: '#ffff00',
            default: '#9932cc',
        },
    },
    musicPalettes: {
        'Go-Concurrent': { scale: ['C3', 'D#3', 'G3', 'G#3', 'C4', 'D#4', 'G4', 'G#4'], synth: null },
        'Go-Systems': { scale: ['A2', 'B2', 'C3', 'E3', 'A3', 'B3', 'C4', 'E4'], synth: null },
        'JS-Async': { scale: ['G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6'], synth: null },
        'JS-DOM': { scale: ['C4', 'E4', 'G4', 'A4', 'B4', 'C5', 'E5', 'G5'], synth: null },
        'JS-Functional': { scale: ['D3', 'F3', 'A3', 'C4', 'E4', 'F4', 'A4', 'C5'], synth: null },
        'Algorithmic-Logic': { scale: ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5', 'D5'], synth: null },
        'default': { scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], synth: null }
    },
};

// Harry Potter Theme
export const harryPotterTheme: Theme = {
    name: 'Harry Potter',
    colors: {
        primary: '#d4af37', // Gold
        secondary: '#8b0000', // Dark red (Gryffindor)
        background: '#0f0f23', // Deep midnight blue
        surface: '#1a1a3a', // Dark blue-purple
        text: '#f4f4f4', // Off-white
        textSecondary: '#c9b037', // Muted gold
        accent: '#228b22', // Forest green (Slytherin)
        border: '#4a4a6a', // Muted purple-gray
        highlight: 'rgba(212, 175, 55, 0.3)', // Golden highlight
        codeBackground: '#0a0a1a', // Very dark blue
    },
    fonts: {
        primary: "'Cinzel', 'Times New Roman', serif", // Magical serif font
        code: "'Source Code Pro', 'Courier New', monospace",
    },
    visualEffects: {
        starColor: '#d4af37', // Golden stars
        starSaturation: 0.8,
        nodeColors: {
            function: '#ff6b35', // Phoenix fire orange
            loop: '#4169e1', // Royal blue (Ravenclaw)
            conditional: '#ffd700', // Bright gold
            default: '#9370db', // Medium slate blue (magical purple)
        },
    },
    musicPalettes: {
        'Go-Concurrent': { scale: ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4'], synth: null }, // Hogwarts theme inspired
        'Go-Systems': { scale: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4'], synth: null }, // Mysterious minor
        'JS-Async': { scale: ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5', 'Bb5', 'C6'], synth: null }, // Quidditch flight
        'JS-DOM': { scale: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'Eb5', 'F5'], synth: null }, // Spell casting
        'JS-Functional': { scale: ['A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'], synth: null }, // Potion brewing
        'Algorithmic-Logic': { scale: ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5'], synth: null }, // Ancient magic
        'default': { scale: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5'], synth: null } // Hogwarts main theme
    },
};

// Stranger Things Theme
export const strangerThingsTheme: Theme = {
    name: 'Stranger Things',
    colors: {
        primary: '#ff0040', // Neon red
        secondary: '#00ff41', // Neon green
        background: '#0a0a0a', // Almost black
        surface: '#1a0a0a', // Dark red tint
        text: '#ff6b6b', // Light red
        textSecondary: '#ff9999', // Muted red
        accent: '#ffff00', // Electric yellow
        border: '#330011', // Dark red border
        highlight: 'rgba(255, 0, 64, 0.4)', // Red highlight
        codeBackground: '#050505', // Pure dark
    },
    fonts: {
        primary: "'Orbitron', 'Courier New', monospace", // Sci-fi font
        code: "'JetBrains Mono', 'Courier New', monospace",
    },
    visualEffects: {
        starColor: '#ff0040', // Red stars
        starSaturation: 1.0,
        nodeColors: {
            function: '#ff0040', // Demogorgon red
            loop: '#00ff41', // Mind Flayer green
            conditional: '#ffff00', // Eleven's powers yellow
            default: '#ff6b6b', // Upside Down red
        },
    },
    musicPalettes: {
        'Go-Concurrent': { scale: ['C2', 'D#2', 'F2', 'G#2', 'C3', 'D#3', 'F3', 'G#3'], synth: null }, // Dark, ominous
        'Go-Systems': { scale: ['A1', 'C2', 'D2', 'F2', 'A2', 'C3', 'D3', 'F3'], synth: null }, // System malfunction
        'JS-Async': { scale: ['E3', 'G3', 'B3', 'D4', 'E4', 'G4', 'B4', 'D5'], synth: null }, // Flickering lights
        'JS-DOM': { scale: ['F#2', 'A2', 'C3', 'E3', 'F#3', 'A3', 'C4', 'E4'], synth: null }, // Upside Down
        'JS-Functional': { scale: ['Bb2', 'D3', 'F3', 'Ab3', 'Bb3', 'D4', 'F4', 'Ab4'], synth: null }, // Mind control
        'Algorithmic-Logic': { scale: ['C#3', 'E3', 'G3', 'Bb3', 'C#4', 'E4', 'G4', 'Bb4'], synth: null }, // Lab experiments
        'default': { scale: ['D3', 'F3', 'Ab3', 'C4', 'D4', 'F4', 'Ab4', 'C5'], synth: null } // Main theme
    },
};

// Marvel Cinematic Universe Theme
export const marvelTheme: Theme = {
    name: 'Marvel',
    colors: {
        primary: '#e23636', // Iron Man red
        secondary: '#ffd700', // Gold accent
        background: '#0c1821', // Dark space blue
        surface: '#1e3a5f', // Steel blue
        text: '#ffffff', // Pure white
        textSecondary: '#b8c5d1', // Light steel blue
        accent: '#00d4ff', // Arc reactor blue
        border: '#2a5490', // Captain America blue
        highlight: 'rgba(226, 54, 54, 0.3)', // Red highlight
        codeBackground: '#0a1419', // Very dark blue
    },
    fonts: {
        primary: "'Rajdhani', 'Arial Black', sans-serif", // Futuristic bold font
        code: "'Fira Code', 'Consolas', monospace",
    },
    visualEffects: {
        starColor: '#ffd700', // Golden stars
        starSaturation: 0.9,
        nodeColors: {
            function: '#e23636', // Iron Man red
            loop: '#00d4ff', // Arc reactor blue
            conditional: '#ffd700', // Gold
            default: '#9d4edd', // Power stone purple
        },
    },
    musicPalettes: {
        'Go-Concurrent': { scale: ['E3', 'G3', 'B3', 'D4', 'E4', 'G4', 'B4', 'D5'], synth: null }, // Heroic major
        'Go-Systems': { scale: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5'], synth: null }, // Tech/FRIDAY
        'JS-Async': { scale: ['A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5'], synth: null }, // Web-slinging
        'JS-DOM': { scale: ['F3', 'A3', 'C4', 'F4', 'A4', 'C5', 'F5', 'A5'], synth: null }, // Avengers assemble
        'JS-Functional': { scale: ['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5'], synth: null }, // Thor's hammer
        'Algorithmic-Logic': { scale: ['G3', 'B3', 'D4', 'G4', 'B4', 'D5', 'G5', 'B5'], synth: null }, // Doctor Strange magic
        'default': { scale: ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6'], synth: null } // Marvel fanfare
    },
};

// Disney Universe Theme
export const disneyTheme: Theme = {
    name: 'Disney',
    colors: {
        primary: '#ff6b9d', // Princess pink
        secondary: '#4fc3f7', // Elsa blue
        background: '#1a0d2e', // Magical night sky
        surface: '#2d1b3d', // Deep purple
        text: '#fff8e1', // Warm cream
        textSecondary: '#e1bee7', // Soft lavender
        accent: '#ffd54f', // Belle's golden yellow
        border: '#7b1fa2', // Royal purple
        highlight: 'rgba(255, 107, 157, 0.3)', // Pink highlight
        codeBackground: '#0f0a1a', // Very dark purple
    },
    fonts: {
        primary: "'Quicksand', 'Comic Sans MS', cursive", // Playful, friendly font
        code: "'Fira Code', 'Monaco', monospace",
    },
    visualEffects: {
        starColor: '#ffd54f', // Golden stars like Tinker Bell's pixie dust
        starSaturation: 1.0,
        nodeColors: {
            function: '#ff6b9d', // Princess pink
            loop: '#4fc3f7', // Frozen blue
            conditional: '#ffd54f', // Magic wand gold
            default: '#ab47bc', // Fairy godmother purple
        },
    },
    musicPalettes: {
        'Go-Concurrent': { scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], synth: null }, // "When You Wish Upon a Star"
        'Go-Systems': { scale: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], synth: null }, // "Be Our Guest" waltz
        'JS-Async': { scale: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], synth: null }, // "A Whole New World" soaring
        'JS-DOM': { scale: ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5'], synth: null }, // "Let It Go" powerful
        'JS-Functional': { scale: ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G#5', 'A5'], synth: null }, // "Under the Sea" playful
        'Algorithmic-Logic': { scale: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'], synth: null }, // "Colors of the Wind" mystical
        'default': { scale: ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6'], synth: null } // Classic Disney magic
    },
};

// Theme registry
export const themes: { [key: string]: Theme } = {
    default: defaultTheme,
    harryPotter: harryPotterTheme,
    strangerThings: strangerThingsTheme,
    marvel: marvelTheme,
    disney: disneyTheme,
};

// Theme context helper
export const getTheme = (themeName: string): Theme => {
    return themes[themeName] || defaultTheme;
};