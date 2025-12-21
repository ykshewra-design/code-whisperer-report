import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, VideoOff, Video, PhoneOff, Volume2, VolumeX, User, SwitchCamera } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { cn } from "@/lib/utils";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useCallTimer } from "@/hooks/useCallTimer";
import { toast } from "sonner";
interface VideoCallScreenProps {
  onEnd: () => void;
  localStream: MediaStream | null;
  roomId: string | null;
  myUserId: string | null;
  peerId: string | null;
  isInitiator: boolean;
}

const VideoCallScreen = ({ 
  onEnd, 
  localStream, 
  roomId, 
  myUserId, 
  peerId, 
  isInitiator 
}: VideoCallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(localStream);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { remoteStream, isConnected, connectionState } = useWebRTC({
    roomId,
    myUserId,
    peerId,
    isInitiator,
    localStream,
  });
  
  const { formattedTime, isRunning, start, stop } = useCallTimer();

  // Start timer when connected
  useEffect(() => {
    if (isConnected && !isRunning) {
      start();
    }
    return () => {
      if (isRunning) stop();
    };
  }, [isConnected, isRunning, start, stop]);

  // Set local video
  useEffect(() => {
    if (localVideoRef.current && (currentStream || localStream)) {
      localVideoRef.current.srcObject = currentStream || localStream;
    }
  }, [localStream, currentStream]);

  // Set remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Initialize current stream
  useEffect(() => {
    setCurrentStream(localStream);
  }, [localStream]);

  // Toggle mute
  const toggleMute = () => {
    const stream = currentStream || localStream;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video on/off
  const toggleVideo = () => {
    const stream = currentStream || localStream;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Switch camera (front/rear)
  const switchCamera = useCallback(async () => {
    try {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      
      // Get new stream with switched camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true,
      });

      // Stop old video tracks
      if (currentStream) {
        currentStream.getVideoTracks().forEach(track => track.stop());
      }

      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }

      setCurrentStream(newStream);
      setFacingMode(newFacingMode);
      
      toast.success(newFacingMode === "user" ? "Switched to front camera" : "Switched to rear camera");
    } catch (err) {
      console.error("Failed to switch camera:", err);
      toast.error("Could not switch camera");
    }
  }, [facingMode, currentStream]);

  // Toggle speaker
  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };
  return (
    <div className="fixed inset-0 bg-background">
      <AnimatedBackground />

      {/* Remote video (full screen) */}
      <div className="absolute inset-0 bg-muted/50">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-32 h-32 rounded-full glass-strong flex items-center justify-center">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {isConnected ? "Waiting for video..." : "Connecting..."}
            </p>
            {connectionState && (
              <p className="text-xs text-muted-foreground/60">
                {connectionState}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Local video (floating preview) */}
      <div className="absolute top-4 right-4 w-32 h-44 md:w-40 md:h-56 rounded-xl overflow-hidden glass-strong border border-border/30 shadow-xl animate-fade-in">
        {localStream && !isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        {isMuted && (
          <div className="absolute bottom-2 right-2 bg-destructive rounded-full p-1">
            <MicOff className="w-3 h-3 text-destructive-foreground" />
          </div>
        )}
      </div>

      {/* Call duration */}
      <div className="absolute top-4 left-4 glass px-4 py-2 rounded-full animate-fade-in">
        <span className="text-foreground font-medium">
          {isConnected ? formattedTime : "Connecting..."}
        </span>
      </div>

      {/* Controls - Order: Mic, Camera Switch, Speaker, Camera On/Off, End Call */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="glass-strong px-4 sm:px-6 py-4 rounded-full flex items-center gap-2 sm:gap-4 animate-fade-in">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all",
              isMuted
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Camera Switch (front/rear) */}
          <button
            onClick={switchCamera}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-all"
          >
            <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Speaker toggle */}
          <button
            onClick={toggleSpeaker}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all",
              !isSpeakerOn
                ? "bg-amber-500 text-white"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Video on/off toggle */}
          <button
            onClick={toggleVideo}
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all",
              isVideoOff
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* End call */}
          <button
            onClick={onEnd}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-destructive hover:bg-destructive/80 text-destructive-foreground flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallScreen;