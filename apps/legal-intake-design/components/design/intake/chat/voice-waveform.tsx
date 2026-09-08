'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { cn } from '@repo/ui/lib/utils';

// Center-weighted bars: the middle crests highest and tapers symmetrically to
// the edges. `taper` scales the live audio height and the fallback peak; `delay`
// is mirrored around the center so the fallback pulse stays symmetric.
const BARS = [
  { id: 'l3', taper: 0.35, delay: '-0.3s' },
  { id: 'l2', taper: 0.6, delay: '-0.2s' },
  { id: 'l1', taper: 0.85, delay: '-0.1s' },
  { id: 'c', taper: 1, delay: '0s' },
  { id: 'r1', taper: 0.85, delay: '-0.1s' },
  { id: 'r2', taper: 0.6, delay: '-0.2s' },
  { id: 'r3', taper: 0.35, delay: '-0.3s' },
];

/**
 * Audio-reactive recording waveform. While `active`, it captures the microphone
 * via the Web Audio API and drives each bar's height from live frequency data
 * (written straight to the DOM in a rAF loop to avoid per-frame React renders).
 * If mic access is unavailable or denied, it falls back to the looping CSS
 * `mz-animate-waveform` so the recording state still reads as live.
 */
export function VoiceWaveform({ active }: { active: boolean }) {
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!active) return;

    let audioContext: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let frame = 0;
    let cancelled = false;

    const setBar = (index: number, scale: number) => {
      const el = barsRef.current[index];
      if (el) el.style.transform = `scaleY(${scale})`;
    };

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFallback(true);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const binsPerBar = Math.floor(data.length / BARS.length) || 1;

        const tick = () => {
          analyser.getByteFrequencyData(data);
          BARS.forEach((bar, i) => {
            let sum = 0;
            for (let j = 0; j < binsPerBar; j++) {
              sum += data[i * binsPerBar + j] ?? 0;
            }
            const avg = sum / binsPerBar / 255; // 0..1
            // Floor so silence still shows a sliver; amplify so speech fills it;
            // taper so the center bar dominates and the sides stay shorter.
            const level = 0.15 + avg * 1.8;
            setBar(i, Math.min(level * bar.taper, 1));
          });
          frame = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      void audioContext?.close().catch(() => undefined);
    };
  }, [active]);

  return (
    <div aria-hidden="true" className="flex h-4 items-center gap-0.5">
      {BARS.map((bar, index) => (
        <span
          key={bar.id}
          ref={(el) => {
            barsRef.current[index] = el;
          }}
          className={cn(
            'bg-foreground h-4 w-[3px] origin-center rounded-full',
            fallback && 'mz-animate-waveform',
          )}
          style={
            fallback
              ? ({
                  animationDelay: bar.delay,
                  '--mz-wave-peak': bar.taper,
                } as CSSProperties)
              : { transform: `scaleY(${0.2 * bar.taper})` }
          }
        />
      ))}
    </div>
  );
}
