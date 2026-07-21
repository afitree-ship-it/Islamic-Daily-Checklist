// Web Audio API Sound Synthesizer for DeenTracker
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard and vendor prefixed support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playCheckSound(isChecked: boolean) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser security policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    if (isChecked) {
      // --- PLAYFUL COG/BELL SUCCESS CHIME ---
      // We use two oscillators to create a clean, organic, bell-pop chime

      // Principal oscillator (Warm Sine)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      
      osc1.type = 'sine';
      // Fast pitch sweep up for a "bubbly/pop" feeling
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // High A5
      
      // Gentle warm volume envelope
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.02); // Fast attack
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25); // Elegant decay
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Secondary oscillator (Soft high overtone to add sparkle)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, now); // E6
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12); // Shorter decay
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      // Play
      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now);
      osc2.stop(now + 0.15);

    } else {
      // --- SUBTLE UNCHECK "PLOP" ---
      // A soft, low-frequency descending thud that feels like an "undo" but isn't annoying
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Slide down quickly
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      // Minimal soft volume
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (error) {
    console.warn("AudioContext playback failed or not supported by browser security policy:", error);
  }
}
