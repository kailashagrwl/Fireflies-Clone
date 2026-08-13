'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Play, Pause, Mic, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

interface Props {
  title: string;
  durationSeconds?: number | null;
  onTimeUpdate?: (seconds: number) => void;
}

export interface MediaPlayerRef {
  seekTo: (seconds: number) => void;
}

const MediaPlayer = forwardRef<MediaPlayerRef, Props>(({ title, durationSeconds, onTimeUpdate }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const simulationIntervalRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [useSimulation, setUseSimulation] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioSource, setAudioSource] = useState<string>('');

  // Fallback sample audio URL: SoundHelix test song
  const defaultSampleUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  useEffect(() => {
    if (durationSeconds) {
      setDuration(durationSeconds);
    }
  }, [durationSeconds]);

  // Clean up simulation interval on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        window.clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const handleSimulatedTimeUpdate = useCallback((nextTime: number) => {
    setCurrentTime(nextTime);
    if (onTimeUpdate) {
      onTimeUpdate(nextTime);
    }
  }, [onTimeUpdate]);

  // Start simulation timer
  const startSimulation = useCallback((startFrom: number) => {
    if (simulationIntervalRef.current) {
      window.clearInterval(simulationIntervalRef.current);
    }

    let simulatedTime = startFrom;
    const intervalMs = 250; // update 4 times a second for smooth slider movement
    const stepSeconds = intervalMs / 1000;

    simulationIntervalRef.current = window.setInterval(() => {
      simulatedTime += stepSeconds;
      if (simulatedTime >= duration) {
        simulatedTime = duration;
        setIsPlaying(false);
        if (simulationIntervalRef.current) {
          window.clearInterval(simulationIntervalRef.current);
        }
      }
      handleSimulatedTimeUpdate(simulatedTime);
    }, intervalMs);
  }, [duration, handleSimulatedTimeUpdate]);

  // Stop simulation timer
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      window.clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // Sync state when native audio plays or pauses
  const playNative = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      if (!audioSource) {
        // lazy load mock/sample track
        setAudioSource(defaultSampleUrl);
        // Wait for next tick so audio element has source set
        setTimeout(async () => {
          if (audioRef.current) {
            await audioRef.current.play();
            setIsPlaying(true);
          }
        }, 50);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      // Graceful fallback to simulation mode on error (e.g. offline or browser block)
      setUseSimulation(true);
      setIsPlaying(true);
      startSimulation(currentTime);
    }
  }, [audioSource, currentTime, startSimulation]);

  const pauseNative = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      if (useSimulation) {
        stopSimulation();
        setIsPlaying(false);
      } else {
        pauseNative();
      }
    } else {
      if (useSimulation) {
        setIsPlaying(true);
        startSimulation(currentTime);
      } else {
        playNative();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || useSimulation) return;
    const current = audioRef.current.currentTime;
    setCurrentTime(current);
    if (onTimeUpdate) {
      onTimeUpdate(current);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current || useSimulation) return;
    // Only overwrite duration if the file duration is valid
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioError = () => {
    // If the audio source fails, fallback immediately to simulation runner
    setUseSimulation(true);
    if (isPlaying) {
      startSimulation(currentTime);
    }
  };

  const handleSeek = (seconds: number) => {
    const boundSeconds = Math.max(0, Math.min(seconds, duration));
    setCurrentTime(boundSeconds);
    
    if (useSimulation) {
      if (isPlaying) {
        startSimulation(boundSeconds);
      } else {
        if (onTimeUpdate) {
          onTimeUpdate(boundSeconds);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = boundSeconds;
      }
      if (onTimeUpdate) {
        onTimeUpdate(boundSeconds);
      }
    }
  };

  // Expose seekTo API via ref
  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      handleSeek(seconds);
    }
  }));

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/6 bg-gradient-to-br from-[#181b26] to-[#111318] p-6">
      {/* Hidden audio element */}
      {audioSource && (
        <audio
          ref={audioRef}
          src={audioSource}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
        />
      )}

      {/* Waveform visualizer (interactive bars) */}
      <div className="flex h-12 items-end gap-0.5 px-2">
        {Array.from({ length: 60 }).map((_, i) => {
          const height = 20 + 70 * Math.abs(Math.sin(i * 0.4 + 1.1));
          const active = i / 60 < pct / 100;
          return (
            <div
              key={i}
              style={{ height: `${height}%` }}
              onClick={() => handleSeek((i / 60) * duration)}
              className={`w-1 rounded-full transition-all cursor-pointer hover:scale-y-110 ${
                active ? 'bg-violet-500 hover:bg-violet-400' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            />
          );
        })}
      </div>

      {/* Progress Slider */}
      <div className="relative flex items-center group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step="any"
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 outline-none accent-violet-500 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
        />
        {/* Visual filled track */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controls & Time details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 shadow-lg shadow-violet-900/50 transition hover:bg-violet-500 active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" fill="white" />
            ) : (
              <Play className="h-4 w-4 text-white" fill="white" />
            )}
          </button>

          <div className="flex flex-col">
            <span className="max-w-[240px] truncate text-xs font-semibold text-slate-300">
              {title}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              {useSimulation ? (
                <span className="text-amber-400/80 flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Simulated Audio Playback (Offline Fallback)
                </span>
              ) : (
                <span>Interactive Media Player</span>
              )}
            </span>
          </div>
        </div>

        {/* Time and Volume Controls */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="font-mono text-xs">
            {formatTimestamp(currentTime)} <span className="text-slate-600">/</span> {formatTimestamp(duration)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-500 hover:text-slate-300 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

MediaPlayer.displayName = 'MediaPlayer';

export default MediaPlayer;
