import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Helper to stop all tracks on the stream and release microphone
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }
    setIsRecording(false);

    // Immediately kill hardware tracks to release hardware mic
    cleanupStream();
  }, [cleanupStream]);

  const startRecording = useCallback(async () => {
    try {
      // First clean up any existing recording/stream
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      cleanupStream();

      setError(null);
      setAudioBase64(null);
      setAudioBlob(null);
      setMimeType(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let preferredMimeType = '';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          preferredMimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          preferredMimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          preferredMimeType = 'audio/mp4';
        }
      }

      const options = preferredMimeType ? { mimeType: preferredMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || preferredMimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(audioBlob);
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64String = base64data.split(',')[1];
          setAudioBase64(base64String);
          setMimeType(actualMimeType);
        };
        reader.onerror = () => {
          setError('Gagal membaca data audio.');
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      cleanupStream();
      setError(
        err.name === 'NotAllowedError'
          ? 'Izin mikrofon ditolak. Harap izinkan akses mikrofon di browser Anda.'
          : 'Gagal mengakses mikrofon.'
      );
      setIsRecording(false);
    }
  }, [cleanupStream]);

  const clearRecording = useCallback(() => {
    setAudioBase64(null);
    setAudioBlob(null);
    setMimeType(null);
    setError(null);
  }, []);

  // Guarantee cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    isRecording,
    audioBase64,
    audioBlob,
    mimeType,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

