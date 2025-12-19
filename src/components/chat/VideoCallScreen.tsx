import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, VideoOff, PhoneOff, SkipForward, User } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { cn } from "@/lib/utils";

interface VideoCallScreenProps {
  onSkip: () => void;
  onEnd: () => void;
}

const VideoCallScreen = ({ onSkip, onEnd }: VideoCallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-background">
      <AnimatedBackground />

      {/* Remote video (full screen placeholder) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Stranger</p>
          </div>
        </div>
      </div>

      {/* Local video preview (floating) */}
      <div
        className={cn(
          "absolute bottom-24 right-4 w-32 h-44 rounded-2xl overflow-hidden",
          "glass-strong shadow-lg transition-opacity",
          isVideoOff && "opacity-50"
        )}
      >
        {isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
            <VideoOff className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Call timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="glass-subtle px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-foreground">
            {formatTime(callDuration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="glass-strong px-6 py-4 rounded-2xl flex items-center gap-4">
          {/* Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              isMuted
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Video toggle */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              isVideoOff
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            <VideoOff className="w-6 h-6" />
          </button>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-14 h-14 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground flex items-center justify-center transition-all"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {/* End call */}
          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/80 text-destructive-foreground flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallScreen;
