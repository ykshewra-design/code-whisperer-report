import { useState, useRef, useEffect } from "react";
import { Send, Video, Mic, SkipForward, X, User } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: Date;
}

interface TextChatScreenProps {
  onSkip: () => void;
  onEnd: () => void;
  onUpgradeToVoice: () => void;
  onUpgradeToVideo: () => void;
}

const TextChatScreen = ({
  onSkip,
  onEnd,
  onUpgradeToVoice,
  onUpgradeToVideo,
}: TextChatScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey! Nice to meet you 👋",
      sender: "stranger",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate stranger response
    setTimeout(() => {
      const responses = [
        "That's interesting!",
        "Tell me more about yourself",
        "Cool! Where are you from?",
        "Haha, nice one!",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: randomResponse,
          sender: "stranger",
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-10 glass-subtle border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Stranger</h3>
              <p className="text-xs text-success">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Upgrade buttons */}
            <button
              onClick={onUpgradeToVoice}
              className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Switch to voice call"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={onUpgradeToVideo}
              className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Switch to video call"
            >
              <Video className="w-5 h-5" />
            </button>

            {/* Skip */}
            <button
              onClick={onSkip}
              className="p-2 rounded-full hover:bg-accent/20 text-accent transition-colors"
              title="Skip to next person"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* End */}
            <button
              onClick={onEnd}
              className="p-2 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
              title="End chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "me" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] px-4 py-2.5 rounded-2xl animate-scale-in",
                message.sender === "me"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "glass-subtle text-foreground rounded-bl-md"
              )}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 p-4 glass-subtle border-t border-border">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              inputValue.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextChatScreen;
