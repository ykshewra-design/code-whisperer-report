import { useState, useCallback, useRef, useEffect } from "react";

interface MediaDevicesState {
  hasCamera: boolean;
  hasMicrophone: boolean;
  cameraPermission: PermissionState | "unknown";
  microphonePermission: PermissionState | "unknown";
  localStream: MediaStream | null;
  error: string | null;
}

interface UseMediaDevicesReturn extends MediaDevicesState {
  requestMedia: (video: boolean, audio: boolean) => Promise<MediaStream | null>;
  stopMedia: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export const useMediaDevices = (): UseMediaDevicesReturn => {
  const [state, setState] = useState<MediaDevicesState>({
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: "unknown",
    microphonePermission: "unknown",
    localStream: null,
    error: null,
  });

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  // Check available devices
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        const hasMicrophone = devices.some((d) => d.kind === "audioinput");
        
        setState((prev) => ({ ...prev, hasCamera, hasMicrophone }));
      } catch (err) {
        console.error("Error checking devices:", err);
      }
    };

    checkDevices();
  }, []);

  const requestMedia = useCallback(async (video: boolean, audio: boolean): Promise<MediaStream | null> => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const constraints: MediaStreamConstraints = {
        video: video ? { facingMode: "user" } : false,
        audio: audio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setState((prev) => ({
        ...prev,
        localStream: stream,
        cameraPermission: video ? "granted" : prev.cameraPermission,
        microphonePermission: audio ? "granted" : prev.microphonePermission,
      }));

      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);

      return stream;
    } catch (err: any) {
      let errorMessage = "Failed to access media devices";
      
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera/microphone access denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera or microphone found.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera or microphone is already in use.";
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setState((prev) => ({ ...prev, localStream: null }));
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled((prev) => !prev);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
    ...state,
    requestMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
  };
};
