import { Video, Mic, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMode = "video" | "voice" | "text";

interface ModeCardProps {
  mode: ChatMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  isPrimary?: boolean;
}

const ModeCard = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
  isPrimary = false,
}: ModeCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-5 rounded-2xl transition-all duration-300 text-left group",
        "border border-transparent",
        isPrimary
          ? "btn-gradient text-primary-foreground hover:scale-[1.02] active:scale-[0.98]"
          : "glass-subtle hover:bg-secondary/60 hover:border-primary/30",
        isSelected && !isPrimary && "border-primary/50 bg-secondary/40"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isPrimary
              ? "bg-primary-foreground/20"
              : "bg-primary/10 group-hover:bg-primary/20"
          )}
        >
          <div className={cn(isPrimary ? "text-primary-foreground" : "text-primary")}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              "font-semibold text-lg",
              isPrimary ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-sm",
              isPrimary ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

interface ModeSelectionProps {
  onSelectMode: (mode: ChatMode) => void;
}

const ModeSelection = ({ onSelectMode }: ModeSelectionProps) => {
  const modes = [
    {
      mode: "video" as ChatMode,
      title: "Video Chat",
      description: "Face-to-face conversations",
      icon: <Video className="w-6 h-6" />,
      isPrimary: true,
    },
    {
      mode: "voice" as ChatMode,
      title: "Voice Chat",
      description: "Audio-only calls",
      icon: <Mic className="w-6 h-6" />,
      isPrimary: false,
    },
    {
      mode: "text" as ChatMode,
      title: "Text Chat",
      description: "Messaging with strangers",
      icon: <MessageSquare className="w-6 h-6" />,
      isPrimary: false,
    },
  ];

  return (
    <div className="space-y-3">
      {modes.map((modeItem) => (
        <ModeCard
          key={modeItem.mode}
          mode={modeItem.mode}
          title={modeItem.title}
          description={modeItem.description}
          icon={modeItem.icon}
          onClick={() => onSelectMode(modeItem.mode)}
          isPrimary={modeItem.isPrimary}
        />
      ))}
    </div>
  );
};

export default ModeSelection;
export type { ChatMode };
