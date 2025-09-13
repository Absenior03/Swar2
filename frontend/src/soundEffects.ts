import * as Tone from 'tone';

// Sound effect configurations for different themes
export interface SoundEffectConfig {
  name: string;
  synthType: any;
  synthOptions: any;
  effects?: any[];
}

// Harry Potter Sound Effects
export const harryPotterSounds: { [key: string]: SoundEffectConfig } = {
  'Go-Concurrent': {
    name: 'Spell Casting',
    synthType: Tone.FMSynth,
    synthOptions: {
      volume: -8,
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    },
    effects: [
      new Tone.Reverb({ roomSize: 0.8, wet: 0.3 }),
      new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.4 })
    ]
  },
  'Go-Systems': {
    name: 'Potion Brewing',
    synthType: Tone.AMSynth,
    synthOptions: {
      volume: -10,
      harmonicity: 2,
      oscillator: { type: 'fattriangle' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.5 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 1.0 }
    },
    effects: [
      new Tone.Filter({ frequency: 800, type: 'lowpass' }),
      new Tone.Delay({ delayTime: 0.3, wet: 0.2 })
    ]
  },
  'JS-Async': {
    name: 'Quidditch Flight',
    synthType: Tone.PluckSynth,
    synthOptions: {
      volume: -6,
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.9
    },
    effects: [
      new Tone.PitchShift({ pitch: 2, wet: 0.3 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.5 })
    ]
  },
  'JS-DOM': {
    name: 'Magic Wand',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -8,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
      }
    },
    effects: [
      new Tone.Tremolo({ frequency: 10, depth: 0.5 }),
      new Tone.Reverb({ roomSize: 0.7, wet: 0.4 })
    ]
  },
  'JS-Functional': {
    name: 'Ancient Magic',
    synthType: Tone.MembraneSynth,
    synthOptions: {
      volume: -12,
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    },
    effects: [
      new Tone.Distortion({ distortion: 0.4, wet: 0.2 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.6 })
    ]
  },
  'Algorithmic-Logic': {
    name: 'Divination',
    synthType: Tone.DuoSynth,
    synthOptions: {
      volume: -10,
      vibratoAmount: 0.5,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.0, sustain: 1, release: 0.5 } },
      voice1: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.0, sustain: 1, release: 0.5 } }
    },
    effects: [
      new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.5 })
    ]
  },
  'default': {
    name: 'Hogwarts Theme',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -8,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }
    },
    effects: [
      new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.3 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.4 })
    ]
  }
};

// Stranger Things Sound Effects
export const strangerThingsSounds: { [key: string]: SoundEffectConfig } = {
  'Go-Concurrent': {
    name: 'Demogorgon',
    synthType: Tone.FMSynth,
    synthOptions: {
      volume: -6,
      harmonicity: 0.5,
      modulationIndex: 20,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.1, release: 2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    },
    effects: [
      new Tone.Distortion({ distortion: 0.8, wet: 0.4 }),
      new Tone.Filter({ frequency: 200, type: 'lowpass' }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.7 })
    ]
  },
  'Go-Systems': {
    name: 'Lab Equipment',
    synthType: Tone.NoiseSynth,
    synthOptions: {
      volume: -15,
      noise: { type: 'white' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.4 }
    },
    effects: [
      new Tone.Filter({ frequency: 1000, type: 'bandpass' }),
      new Tone.Delay({ delayTime: 0.1, wet: 0.3 })
    ]
  },
  'JS-Async': {
    name: 'Flickering Lights',
    synthType: Tone.AMSynth,
    synthOptions: {
      volume: -12,
      harmonicity: 1,
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.01, sustain: 0.4, release: 0.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    },
    effects: [
      new Tone.Tremolo({ frequency: 8, depth: 0.8 }),
      new Tone.Filter({ frequency: 400, type: 'highpass' })
    ]
  },
  'JS-DOM': {
    name: 'Upside Down',
    synthType: Tone.FMSynth,
    synthOptions: {
      volume: -10,
      harmonicity: 0.3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.2, decay: 0.4, sustain: 0.2, release: 1.5 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.2 }
    },
    effects: [
      new Tone.PitchShift({ pitch: -12, wet: 0.5 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.8 }),
      new Tone.Filter({ frequency: 300, type: 'lowpass' })
    ]
  },
  'JS-Functional': {
    name: 'Mind Control',
    synthType: Tone.DuoSynth,
    synthOptions: {
      volume: -8,
      vibratoAmount: 0.8,
      vibratoRate: 2,
      harmonicity: 0.7,
      voice0: { oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.0, sustain: 1, release: 1 } },
      voice1: { oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.0, sustain: 1, release: 1 } }
    },
    effects: [
      new Tone.Phaser({ frequency: 0.3, octaves: 5, baseFrequency: 200 }),
      new Tone.Chorus({ frequency: 0.5, delayTime: 2, depth: 0.9, wet: 0.6 })
    ]
  },
  'Algorithmic-Logic': {
    name: 'Eleven Powers',
    synthType: Tone.MetalSynth,
    synthOptions: {
      volume: -15,
      frequency: 200,
      envelope: { attack: 0.001, decay: 1.4, sustain: 0.1, release: 0.03 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    },
    effects: [
      new Tone.Distortion({ distortion: 0.6, wet: 0.3 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.5 })
    ]
  },
  'default': {
    name: 'Stranger Things Theme',
    synthType: Tone.MonoSynth,
    synthOptions: {
      volume: -8,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.8 },
      filterEnvelope: { attack: 0.001, decay: 0.7, sustain: 0.1, release: 0.8, baseFrequency: 300, octaves: 4 }
    },
    effects: [
      new Tone.Filter({ frequency: 800, type: 'lowpass' }),
      new Tone.Delay({ delayTime: 0.25, wet: 0.2 }),
      new Tone.Reverb({ roomSize: 0.6, wet: 0.3 })
    ]
  }
};

// Default sound effects (original)
export const defaultSounds: { [key: string]: SoundEffectConfig } = {
  'Go-Concurrent': {
    name: 'FM Synthesis',
    synthType: Tone.FMSynth,
    synthOptions: { volume: -6, oscillator: { type: 'sine8' } },
    effects: []
  },
  'Go-Systems': {
    name: 'AM Synthesis',
    synthType: Tone.AMSynth,
    synthOptions: { volume: -6, oscillator: { type: 'sine8' } },
    effects: []
  },
  'JS-Async': {
    name: 'Pluck Synthesis',
    synthType: Tone.PluckSynth,
    synthOptions: { volume: -6 },
    effects: []
  },
  'JS-DOM': {
    name: 'Poly Synthesis',
    synthType: Tone.PolySynth,
    synthOptions: { volume: -6, voice: Tone.Synth },
    effects: []
  },
  'JS-Functional': {
    name: 'Membrane Synthesis',
    synthType: Tone.MembraneSynth,
    synthOptions: { volume: -6 },
    effects: []
  },
  'Algorithmic-Logic': {
    name: 'Poly Synthesis',
    synthType: Tone.PolySynth,
    synthOptions: { volume: -6, voice: Tone.Synth },
    effects: []
  },
  'default': {
    name: 'Default Poly',
    synthType: Tone.PolySynth,
    synthOptions: { volume: -6, voice: Tone.Synth },
    effects: []
  }
};

// Marvel Sound Effects
export const marvelSounds: { [key: string]: SoundEffectConfig } = {
  'Go-Concurrent': {
    name: 'Iron Man Suit',
    synthType: Tone.FMSynth,
    synthOptions: {
      volume: -8,
      harmonicity: 2,
      modulationIndex: 15,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.8 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.5 }
    },
    effects: [
      new Tone.Distortion({ distortion: 0.3, wet: 0.2 }),
      new Tone.Filter({ frequency: 1200, type: 'highpass' }),
      new Tone.Reverb({ roomSize: 0.4, wet: 0.3 })
    ]
  },
  'Go-Systems': {
    name: 'FRIDAY AI',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -10,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'square4' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.3 }
      }
    },
    effects: [
      new Tone.Filter({ frequency: 800, type: 'bandpass' }),
      new Tone.Chorus({ frequency: 2, delayTime: 2.5, depth: 0.5, wet: 0.3 }),
      new Tone.Delay({ delayTime: 0.1, wet: 0.2 })
    ]
  },
  'JS-Async': {
    name: 'Web Slinging',
    synthType: Tone.PluckSynth,
    synthOptions: {
      volume: -6,
      attackNoise: 2,
      dampening: 2000,
      resonance: 0.8
    },
    effects: [
      new Tone.PitchShift({ pitch: 7, wet: 0.4 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.5 }),
      new Tone.Filter({ frequency: 2000, type: 'lowpass' })
    ]
  },
  'JS-DOM': {
    name: 'Avengers Assemble',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -6,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 1.2 }
      }
    },
    effects: [
      new Tone.Chorus({ frequency: 1, delayTime: 4, depth: 0.8, wet: 0.4 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.6 }),
      new Tone.Filter({ frequency: 1500, type: 'highpass' })
    ]
  },
  'JS-Functional': {
    name: 'Thor Thunder',
    synthType: Tone.MembraneSynth,
    synthOptions: {
      volume: -8,
      pitchDecay: 0.1,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.6, sustain: 0.1, release: 2 }
    },
    effects: [
      new Tone.Distortion({ distortion: 0.6, wet: 0.3 }),
      new Tone.Filter({ frequency: 100, type: 'lowpass' }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.8 })
    ]
  },
  'Algorithmic-Logic': {
    name: 'Doctor Strange Magic',
    synthType: Tone.DuoSynth,
    synthOptions: {
      volume: -10,
      vibratoAmount: 0.8,
      vibratoRate: 3,
      harmonicity: 1.2,
      voice0: { oscillator: { type: 'sine' }, envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 1 } },
      voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 1 } }
    },
    effects: [
      new Tone.Phaser({ frequency: 1.5, octaves: 4, baseFrequency: 400 }),
      new Tone.Chorus({ frequency: 0.8, delayTime: 5, depth: 0.9, wet: 0.5 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.7 })
    ]
  },
  'default': {
    name: 'Marvel Fanfare',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -6,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 1 }
      }
    },
    effects: [
      new Tone.Chorus({ frequency: 1.2, delayTime: 3, depth: 0.6, wet: 0.3 }),
      new Tone.Reverb({ roomSize: 0.7, wet: 0.4 })
    ]
  }
};

// Disney Sound Effects
export const disneySounds: { [key: string]: SoundEffectConfig } = {
  'Go-Concurrent': {
    name: 'Fairy Godmother Magic',
    synthType: Tone.FMSynth,
    synthOptions: {
      volume: -10,
      harmonicity: 3,
      modulationIndex: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1.5 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.9, release: 1.0 }
    },
    effects: [
      new Tone.Chorus({ frequency: 2, delayTime: 2.5, depth: 0.8, wet: 0.5 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.6 }),
      new Tone.Filter({ frequency: 1500, type: 'highpass' })
    ]
  },
  'Go-Systems': {
    name: 'Enchanted Objects',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -12,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.8 }
      }
    },
    effects: [
      new Tone.Tremolo({ frequency: 6, depth: 0.6 }),
      new Tone.Filter({ frequency: 800, type: 'bandpass' }),
      new Tone.Delay({ delayTime: 0.2, wet: 0.3 })
    ]
  },
  'JS-Async': {
    name: 'Flying Carpet',
    synthType: Tone.PluckSynth,
    synthOptions: {
      volume: -8,
      attackNoise: 0.5,
      dampening: 3000,
      resonance: 0.9
    },
    effects: [
      new Tone.PitchShift({ pitch: 5, wet: 0.3 }),
      new Tone.Chorus({ frequency: 1.5, delayTime: 3, depth: 0.7, wet: 0.4 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.5 })
    ]
  },
  'JS-DOM': {
    name: 'Princess Ballroom',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -8,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.7, release: 1.5 }
      }
    },
    effects: [
      new Tone.Chorus({ frequency: 0.8, delayTime: 4, depth: 0.6, wet: 0.4 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.7 }),
      new Tone.Filter({ frequency: 2000, type: 'lowpass' })
    ]
  },
  'JS-Functional': {
    name: 'Under the Sea',
    synthType: Tone.MembraneSynth,
    synthOptions: {
      volume: -12,
      pitchDecay: 0.08,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 1.0 }
    },
    effects: [
      new Tone.Filter({ frequency: 400, type: 'lowpass' }),
      new Tone.Chorus({ frequency: 3, delayTime: 1.5, depth: 0.9, wet: 0.6 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.8 })
    ]
  },
  'Algorithmic-Logic': {
    name: 'Elsa Ice Magic',
    synthType: Tone.DuoSynth,
    synthOptions: {
      volume: -10,
      vibratoAmount: 0.6,
      vibratoRate: 4,
      harmonicity: 1.8,
      voice0: { oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1.2 } },
      voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1.2 } }
    },
    effects: [
      new Tone.Filter({ frequency: 1200, type: 'highpass' }),
      new Tone.Phaser({ frequency: 2, octaves: 3, baseFrequency: 500 }),
      new Tone.Reverb({ roomSize: 0.9, wet: 0.8 })
    ]
  },
  'default': {
    name: 'When You Wish Upon a Star',
    synthType: Tone.PolySynth,
    synthOptions: {
      volume: -8,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 1.2 }
      }
    },
    effects: [
      new Tone.Chorus({ frequency: 1, delayTime: 4, depth: 0.5, wet: 0.3 }),
      new Tone.Reverb({ roomSize: 0.8, wet: 0.5 }),
      new Tone.Filter({ frequency: 1800, type: 'lowpass' })
    ]
  }
};

// Sound effect registry
export const soundEffects: { [themeName: string]: { [key: string]: SoundEffectConfig } } = {
  default: defaultSounds,
  harryPotter: harryPotterSounds,
  strangerThings: strangerThingsSounds,
  marvel: marvelSounds,
  disney: disneySounds,
};

// Helper function to create synth with effects
export const createThemedSynth = (themeName: string, paletteKey: string): any => {
  const themeEffects = soundEffects[themeName] || soundEffects.default;
  const effectConfig = themeEffects[paletteKey] || themeEffects.default;
  
  const synth = new effectConfig.synthType(effectConfig.synthOptions);
  
  if (effectConfig.effects && effectConfig.effects.length > 0) {
    // Chain effects
    let chain = synth;
    effectConfig.effects.forEach(effect => {
      chain = chain.connect(effect);
    });
    chain.toDestination();
  } else {
    synth.toDestination();
  }
  
  return synth;
};