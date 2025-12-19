import { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff, SkipForward, User, Volume2 } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface VoiceCallScreenProps {
  onSkip: () => void;
  onEnd: () => void;
}

const VoiceCallScreen = ({ onSkip, onEnd }: VoiceCallScreenProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

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
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
      <AnimatedBackground />

      {/* Phone-style UI */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fade-in">
        {/* Avatar with audio visualizer effect */}
        <div className="relative">
          {/* Pulsing ring to simulate audio */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-125" />
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse scale-150" style={{ animationDelay: "0.3s" }} />
          
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
            <Volume2 className="w-4 h-4" />
            <span className="text-sm">Connected</span>
          </div>
        </div>

        {/* Call duration */}
        <div className="text-4xl font-light text-foreground tracking-wider">
          {formatTime(callDuration)}
        </div>
      </div>

      {/* Controls */}
      <div className="pb-12">
        <div className="glass-strong px-8 py-5 rounded-full flex items-center gap-6">
          {/* Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              isMuted
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            )}
          >
            {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-16 h-16 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground flex items-center justify-center transition-all"
          >
            <SkipForward className="w-7 h-7" />
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
