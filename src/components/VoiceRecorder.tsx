'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { cn, generateId, formatDuration, vibrate } from '@/lib/utils';

interface RecordedVoiceNote {
  localId: string;
  blob: Blob;
  durationSeconds: number;
  transcription: string;
}

interface VoiceRecorderProps {
  voiceNotes: RecordedVoiceNote[];
  onRecordingComplete: (note: RecordedVoiceNote) => void;
  onRemove: (localId: string) => void;
  className?: string;
}

export function VoiceRecorder({
  voiceNotes,
  onRecordingComplete,
  onRemove,
  className,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start MediaRecorder for audio capture
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];
      transcriptRef.current = '';

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create blob from chunks
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        const note: RecordedVoiceNote = {
          localId: generateId(),
          blob,
          durationSeconds: duration,
          transcription: transcriptRef.current,
        };

        onRecordingComplete(note);
        setDuration(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      // Try to start speech recognition for transcription
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join(' ');
            transcriptRef.current = transcript;
          };

          recognition.onerror = (event: any) => {
            console.log('Speech recognition error:', event.error);
            // Don't fail - speech recognition is optional
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        }
      } catch (speechError) {
        console.log('Speech recognition not available:', speechError);
        // Continue without speech recognition
      }

      setIsRecording(true);
      vibrate(50);
    } catch (error) {
      console.error('Error starting recording:', error);
      setPermissionDenied(true);
    }
  }, [duration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    vibrate(50);
  }, []);

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (permissionDenied) {
    return (
      <div className={cn("p-4 bg-danger/10 text-danger rounded-xl text-center", className)}>
        <p className="text-sm font-medium">Microphone access denied</p>
        <p className="text-xs mt-1">Please enable microphone access in your browser settings</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Recording button */}
      <button
        type="button"
        onClick={handleRecordToggle}
        className={cn(
          "flex items-center justify-center gap-3 w-full py-4 rounded-xl",
          "font-medium transition-all active:scale-[0.98]",
          "touch-manipulation",
          isRecording
            ? "bg-danger text-white"
            : "bg-primary text-white"
        )}
      >
        {isRecording ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Recording • {formatDuration(duration)}</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>Hold or Tap to Record</span>
          </>
        )}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-3 text-danger">
          <span className="w-3 h-3 rounded-full bg-danger animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {/* Voice notes list */}
      {voiceNotes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-text-muted">Recorded notes:</p>
          {voiceNotes.map((note) => (
            <VoiceNoteItem
              key={note.localId}
              note={note}
              onRemove={() => onRemove(note.localId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VoiceNoteItemProps {
  note: RecordedVoiceNote;
  onRemove: () => void;
}

function VoiceNoteItem({ note, onRemove }: VoiceNoteItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl] = useState(() => URL.createObjectURL(note.blob));

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-bg-subtle rounded-lg">
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{formatDuration(note.durationSeconds)}</p>
        {note.transcription && (
          <p className="text-xs text-text-muted truncate">{note.transcription}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-text-muted hover:text-danger"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
