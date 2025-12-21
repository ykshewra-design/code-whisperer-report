import { Video, Mic, MessageSquare } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import { ChatMode } from "@/components/ModeSelection";
import { cn } from "@/lib/utils";

interface FindingScreenProps {
  mode: ChatMode;
  onCancel: () => void;
  isSearching?: boolean;
}

const FindingScreen = ({ mode, onCancel, isSearching = true }: FindingScreenProps) => {
  const modeConfig = {
    video: {
      icon: <Video className="w-8 h-8" />,
      label: "Video Chat",
      color: "from-primary to-accent",
    },
    voice: {
      icon: <Mic className="w-8 h-8" />,
      label: "Voice Chat",
      color: "from-accent to-primary",
    },
    text: {
      icon: <MessageSquare className="w-8 h-8" />,
      label: "Text Chat",
      color: "from-primary via-purple-500 to-accent",
    },
  };

  const config = modeConfig[mode];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="text-center space-y-8 animate-fade-in">
        {/* Pulsing avatar with rings */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="pulse-ring w-32 h-32"
              style={{
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}

          {/* Center icon */}
          <GlassPanel
            variant="strong"
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-gradient-to-br",
              config.color
            )}
          >
            <div className="text-primary-foreground">{config.icon}</div>
          </GlassPanel>
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {isSearching ? "Searching..." : "Connecting..."}
          </h2>
          <p className="text-muted-foreground">
            Looking for a {config.label.toLowerCase()} partner
          </p>
          <p className="text-sm text-muted-foreground/60">
            Waiting for a real person to join
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="glass-subtle px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FindingScreen;