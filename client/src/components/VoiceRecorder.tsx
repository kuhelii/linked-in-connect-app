"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder = ({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob, duration);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start audio level animation
      updateAudioLevel();
    } catch (error) {
      console.error("Error starting voice recording:", error);
      toast.error("Failed to start voice recording");
      onCancel();
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255); // Normalize to 0-1

    animationRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      cleanup();
    }
  };

  const cancelRecording = () => {
    cleanup();
    onCancel();
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
      {/* Audio visualization */}
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full transition-all duration-100"
            style={{
              height: `${
                8 + audioLevel * 20 + Math.sin(Date.now() / 100 + i) * 4
              }px`,
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className="text-sm font-mono">{formatDuration(duration)}</span>

      {/* Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={cancelRecording}
          className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-background transition-colors"
          title="Cancel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <button
          onClick={stopRecording}
          className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          title="Send"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
