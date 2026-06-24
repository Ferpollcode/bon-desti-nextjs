"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  active: boolean;
}

export default function EmergencyAlarm({ active }: Props) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  function stopAlarm() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function beep(context: AudioContext) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  }

  async function startAlarm() {
    if (!active || intervalRef.current) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      beep(context);
      intervalRef.current = window.setInterval(() => beep(context), 1800);
      setSoundBlocked(false);
      setSoundEnabled(true);
    } catch {
      setSoundBlocked(true);
      setSoundEnabled(false);
    }
  }

  useEffect(() => {
    if (!active) {
      stopAlarm();
      setSoundBlocked(false);
      setSoundEnabled(false);
      return;
    }

    startAlarm();

    return stopAlarm;
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div className="security-alarm" role="alert" aria-live="assertive">
      <div className="security-alarm-light" aria-hidden="true" />
      <div>
        <strong>ALERTA DE EMERGENCIA</strong>
        <span>{soundEnabled ? "Sirena activa" : "Luz de emergencia activa"}</span>
      </div>
      {(soundBlocked || !soundEnabled) && (
        <button type="button" className="btn btn-sm btn-danger" onClick={startAlarm}>
          <i className="ti ti-volume" /> Activar sonido
        </button>
      )}
      <a className="btn btn-sm btn-danger call-911-link" href="tel:911">
        <i className="ti ti-phone-call" /> Llamar 911
      </a>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
