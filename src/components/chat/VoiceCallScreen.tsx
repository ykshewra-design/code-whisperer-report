import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, User, Volume2, VolumeX } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useCallTimer } from "@/hooks/useCallTimer";

interface VoiceCallScreenProps {
  onEnd: () => void;
  localStream: MediaStream | null;
  roomId: string | null;
  myUserId: string | null;
  peerId: string | null;
  isInitiator: boolean;
}

const VoiceCallScreen = ({ 
  onEnd, 
  localStream, 
  roomId, 
  myUserId, 
  peerId, 
  isInitiator 
}: VoiceCallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
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

  // Set remote audio
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
      <AnimatedBackground />

      {/* Hidden audio element for remote stream */}
      <audio ref={audioRef} autoPlay />

      {/* Phone-style UI */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
        {/* Avatar with audio visualizer effect */}
        <div className="relative">
          {/* Pulsing ring to simulate audio */}
          {isConnected && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-125" />
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse scale-150" style={{ animationDelay: "0.3s" }} />
            </>
          )}
          
          <GlassPanel
            variant="strong"
            className="w-32 h-32 rounded-full flex items-center justify-center relative z-10"
          >
            <User className="w-16 h-16 text-muted-foreground" />
          </GlassPanel>
        </div>

        {/* Caller info */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Stranger</h2>
          <div className="flex items-center justify-center gap-2 text-success">
            {isConnected ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{connectionState || "Connecting..."}</span>
            )}
          </div>
        </div>

        {/* Call duration */}
        <div className="text-4xl font-light text-foreground tracking-wider">
          {isConnected ? formattedTime : "--:--"}
        </div>
      </div>

      {/* Controls */}
      <div className="pb-12">
        <div className="glass-strong px-8 py-5 rounded-full flex items-center gap-6">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              isMuted
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          {/* Speaker toggle */}
          <button
            onClick={toggleSpeaker}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              !isSpeakerOn
                ? "bg-amber-500 text-white"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isSpeakerOn ? <Volume2 className="w-7 h-7" /> : <VolumeX className="w-7 h-7" />}
          </button>

          {/* End call */}
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/80 text-destructive-foreground flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallScreen;