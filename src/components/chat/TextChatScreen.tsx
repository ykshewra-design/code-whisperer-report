import { useState, useRef, useEffect } from "react";
import { Send, Video, Phone, X, User, Image } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";
import { chatService, ChatMessage } from "@/services/chatService";

interface DisplayMessage {
  id: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: Date;
  type: "text" | "image" | "video";
  mediaUrl?: string;
}

interface TextChatScreenProps {
  onEnd: () => void;
  onUpgradeToVoice: () => void;
  onUpgradeToVideo: () => void;
  roomId: string | null;
  myUserId: string | null;
  peerId: string | null;
}

const TextChatScreen = ({
  onEnd,
  onUpgradeToVoice,
  onUpgradeToVideo,
  roomId,
  myUserId,
  peerId,
}: TextChatScreenProps) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat service
  useEffect(() => {
    if (roomId && myUserId) {
      chatService.init(roomId, myUserId);
      setIsConnected(true);

      // Set up message listener
      chatService.onMessage((message: ChatMessage) => {
        // Don't add our own messages (they're already added optimistically)
        if (message.sender_id === myUserId) return;

        const newMessage: DisplayMessage = {
          id: message.id,
          text: message.content || "",
          sender: "stranger",
          timestamp: new Date(message.created_at),
          type: message.message_type as "text" | "image" | "video",
          mediaUrl: message.media_url || undefined,
        };
        setMessages(prev => [...prev, newMessage]);
      });

      // Load chat history
      chatService.getHistory().then(history => {
        const displayMessages: DisplayMessage[] = history.map(msg => ({
          id: msg.id,
          text: msg.content || "",
          sender: msg.sender_id === myUserId ? "me" : "stranger",
          timestamp: new Date(msg.created_at),
          type: msg.message_type as "text" | "image" | "video",
          mediaUrl: msg.media_url || undefined,
        }));
        setMessages(displayMessages);
      });
    }

    return () => {
      chatService.cleanup();
    };
  }, [roomId, myUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !isConnected) return;

    const messageText = inputValue.trim();
    setInputValue("");

    // Add message optimistically
    const tempMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      text: messageText,
      sender: "me",
      timestamp: new Date(),
      type: "text",
    };
    setMessages(prev => [...prev, tempMessage]);

    // Send to server
    try {
      await chatService.sendMessage(messageText);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return;
    }

    const type = isImage ? "image" : "video";
    const mediaUrl = URL.createObjectURL(file);

    // Add message optimistically
    const tempMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      text: "",
      sender: "me",
      timestamp: new Date(),
      type,
      mediaUrl,
    };
    setMessages(prev => [...prev, tempMessage]);

    // Send to server
    try {
      await chatService.sendMediaMessage(file, type);
    } catch (error) {
      console.error("Failed to send media:", error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
              <p className="text-xs text-success">
                {isConnected ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Upgrade to voice */}
            <button
              onClick={onUpgradeToVoice}
              className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Start voice call"
            >
              <Phone className="w-5 h-5" />
            </button>
            
            {/* Upgrade to video */}
            <button
              onClick={onUpgradeToVideo}
              className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Start video call"
            >
              <Video className="w-5 h-5" />
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
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground/60 py-8">
            <p>Say hello to your new friend!</p>
          </div>
        )}
        
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
              {message.type === "text" && (
                <p className="text-sm break-words">{message.text}</p>
              )}
              {message.type === "image" && message.mediaUrl && (
                <img 
                  src={message.mediaUrl} 
                  alt="Shared image" 
                  className="max-w-full rounded-lg max-h-64 object-cover"
                />
              )}
              {message.type === "video" && message.mediaUrl && (
                <video 
                  src={message.mediaUrl} 
                  controls 
                  className="max-w-full rounded-lg max-h-64"
                />
              )}
              <span
                className={cn(
                  "text-[10px] block mt-1",
                  message.sender === "me"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 p-4 glass-subtle border-t border-border">
        <div className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Send image or video"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-secondary/50 border border-border rounded-full px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            disabled={!isConnected}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected}
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