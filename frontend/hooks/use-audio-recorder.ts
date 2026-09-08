"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

// Keep enough Opus detail for short multilingual commands and similar-sounding
// Bangla/Banglish words while remaining much smaller than uncompressed PCM.
const SPEECH_AUDIO_BITS_PER_SECOND = 96_000;
const SPEECH_SAMPLE_RATE = 16_000;
const RECORDER_TIMESLICE_MS = 250;

export function useAudioRecorder(
  onRecorded: (audio: Blob) => void,
  maxSeconds = 60,
) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported =
    typeof window !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    stop();
    release();
  }, [release, stop]);

  const start = useCallback(async () => {
    if (!supported || isRecording) return false;
    setError(null);
    discardRef.current = false;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: SPEECH_SAMPLE_RATE },
          sampleSize: { ideal: 16 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const mimeType = MIME_TYPES.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: SPEECH_AUDIO_BITS_PER_SECOND,
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const shouldSend = !discardRef.current && blob.size > 0;
        release();
        if (shouldSend) onRecorded(blob);
      };
      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        release();
      };
      // Periodic chunks avoid holding one large encoded buffer in memory and
      // make stopping/finalizing the recording faster on mobile browsers.
      recorder.start(RECORDER_TIMESLICE_MS);
      setSeconds(0);
      setIsRecording(true);
      timerRef.current = setInterval(
        () => setSeconds((value) => value + 1),
        1000,
      );
      timeoutRef.current = setTimeout(stop, maxSeconds * 1000);
      return true;
    } catch {
      setError("Microphone permission was not granted.");
      release();
      return false;
    }
  }, [isRecording, maxSeconds, onRecorded, release, stop, supported]);

  useEffect(() => cancel, [cancel]);

  return { supported, isRecording, seconds, error, start, stop, cancel };
}
