'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, DollarSign, Package, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { VoiceStructuredData } from '@/lib/types';

interface AudioPlayerProps {
  src: string | Blob;
  duration?: number;
  transcription?: string;
  structuredData?: VoiceStructuredData;
  aiProcessed?: boolean;
  onEnded?: () => void;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({
  src,
  duration: initialDuration,
  transcription,
  structuredData,
  aiProcessed,
  onEnded,
  className,
  compact = false,
}: AudioPlayerProps) {
  const [showStructuredData, setShowStructuredData] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Create audio URL from blob or use string URL
  useEffect(() => {
    if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(src);
    }
  }, [src]);

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoaded(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Try to load
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, onEnded]);

  // Update muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const restart = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Handle progress bar click/touch
  const handleProgressClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const clickPosition = (clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;

    audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
    setCurrentTime(newTime);
  }, [duration]);

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!isLoaded && !audioUrl}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            "transition-colors",
            isPlaying
              ? "bg-primary text-white"
              : "bg-primary/10 text-primary"
          )}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-1.5 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between mt-1 text-xs text-text-muted">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 bg-bg-subtle rounded-xl", className)}>
      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={!isLoaded && !audioUrl}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            "transition-colors",
            isPlaying
              ? "bg-primary text-white"
              : "bg-primary text-white"
          )}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        {/* Progress section */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-2 bg-gray-300 rounded-full cursor-pointer overflow-hidden touch-none"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
            onTouchMove={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between mt-1.5 text-xs text-text-muted">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Additional controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={restart}
            className="p-2 text-text-muted hover:text-foreground"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-text-muted hover:text-foreground"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Transcription */}
      {transcription && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-muted mb-1 font-medium">Transcription:</p>
          <p className="text-sm text-foreground">{transcription}</p>
        </div>
      )}

      {/* AI Structured Data */}
      {aiProcessed && structuredData && Object.keys(structuredData).length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => setShowStructuredData(!showStructuredData)}
            className="flex items-center gap-2 text-xs text-primary font-medium w-full"
          >
            <span>AI Extracted Data</span>
            {showStructuredData ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showStructuredData && (
            <StructuredDataDisplay data={structuredData} />
          )}
        </div>
      )}
    </div>
  );
}

// Structured data display component for AI-extracted information
function StructuredDataDisplay({ data }: { data: VoiceStructuredData }) {
  return (
    <div className="mt-3 space-y-3">
      {/* Summary */}
      {data.summary && (
        <div className="p-3 bg-primary/5 rounded-lg">
          <p className="text-sm text-foreground">{data.summary}</p>
        </div>
      )}

      {/* Prices Mentioned */}
      {data.pricesMentioned && data.pricesMentioned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Prices Mentioned</span>
          </div>
          <div className="space-y-1">
            {data.pricesMentioned.map((price, i) => (
              <div key={i} className="flex justify-between text-sm p-2 bg-white rounded border border-border">
                <span className="text-foreground">{price.product}</span>
                <span className="font-medium text-primary">
                  {price.currency} {price.price}/{price.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOQ and Lead Time */}
      <div className="grid grid-cols-2 gap-2">
        {data.moqMentioned && (
          <div className="p-2 bg-white rounded border border-border">
            <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
              <Package className="w-3 h-3" />
              <span>MOQ</span>
            </div>
            <p className="text-sm font-medium">{data.moqMentioned} units</p>
          </div>
        )}
        {data.leadTimeMentioned && (
          <div className="p-2 bg-white rounded border border-border">
            <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
              <Clock className="w-3 h-3" />
              <span>Lead Time</span>
            </div>
            <p className="text-sm font-medium">{data.leadTimeMentioned}</p>
          </div>
        )}
      </div>

      {/* Key Specs */}
      {data.keySpecs && data.keySpecs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Key Specs</p>
          <div className="flex flex-wrap gap-1">
            {data.keySpecs.map((spec, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{spec}</span>
            ))}
          </div>
        </div>
      )}

      {/* Manufacturer/Trader Signals */}
      {data.manufacturerSignals && data.manufacturerSignals.length > 0 && (
        <div className="p-2 bg-success/5 rounded border border-success/20">
          <div className="flex items-center gap-1 text-xs text-success font-medium mb-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Manufacturer Signals</span>
          </div>
          <ul className="text-xs text-success/80 space-y-0.5">
            {data.manufacturerSignals.map((signal, i) => (
              <li key={i}>• {signal}</li>
            ))}
          </ul>
        </div>
      )}

      {data.traderSignals && data.traderSignals.length > 0 && (
        <div className="p-2 bg-warning/5 rounded border border-warning/20">
          <div className="flex items-center gap-1 text-xs text-warning font-medium mb-1">
            <AlertCircle className="w-3 h-3" />
            <span>Trader Signals</span>
          </div>
          <ul className="text-xs text-warning/80 space-y-0.5">
            {data.traderSignals.map((signal, i) => (
              <li key={i}>• {signal}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Notable Points */}
      {data.notablePoints && data.notablePoints.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-muted mb-1">Notable Points</p>
          <ul className="text-sm text-foreground space-y-1">
            {data.notablePoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Voice note list with audio players
interface VoiceNoteListProps {
  voiceNotes: Array<{
    localId: string;
    blob?: Blob;
    remotePath?: string;
    durationSeconds: number;
    transcription?: string;
    structuredData?: VoiceStructuredData;
    aiProcessed?: boolean;
  }>;
  className?: string;
}

export function VoiceNoteList({ voiceNotes, className }: VoiceNoteListProps) {
  if (voiceNotes.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-24 rounded-xl bg-bg-subtle text-text-muted",
        className
      )}>
        <p className="text-sm">No voice notes</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {voiceNotes.map((note, index) => {
        // Prefer blob, fall back to remote path
        const src = note.blob || note.remotePath || '';

        if (!src) {
          return (
            <div
              key={note.localId}
              className="p-4 bg-bg-subtle rounded-xl text-text-muted text-sm"
            >
              Voice note {index + 1} - {formatDuration(note.durationSeconds)} (unavailable)
            </div>
          );
        }

        return (
          <AudioPlayer
            key={note.localId}
            src={src}
            duration={note.durationSeconds}
            transcription={note.transcription}
            structuredData={note.structuredData}
            aiProcessed={note.aiProcessed}
          />
        );
      })}
    </div>
  );
}
