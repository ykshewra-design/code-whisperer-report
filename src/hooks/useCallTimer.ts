import { useState, useEffect, useCallback } from "react";

interface UseCallTimerReturn {
  duration: number;
  formatted: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useCallTimer = (): UseCallTimerReturn => {
  const [duration, setDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setDuration(0);
    setIsRunning(true);
  }, []);

  return {
    duration,
    formatted: formatTime(duration),
    start,
    stop,
    reset,
  };
};
