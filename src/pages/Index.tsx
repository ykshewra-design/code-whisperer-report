import { useState } from "react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import Header from "@/components/Header";
import ModeSelection, { ChatMode } from "@/components/ModeSelection";
import FindingScreen from "@/components/FindingScreen";
import VideoCallScreen from "@/components/chat/VideoCallScreen";
import VoiceCallScreen from "@/components/chat/VoiceCallScreen";
import TextChatScreen from "@/components/chat/TextChatScreen";

type AppState = "landing" | "finding" | "connected";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("landing");
  const [selectedMode, setSelectedMode] = useState<ChatMode | null>(null);

  const handleSelectMode = (mode: ChatMode) => {
    setSelectedMode(mode);
    setAppState("finding");
    
    // Simulate finding a partner (will be replaced with real signaling)
    setTimeout(() => {
      setAppState("connected");
    }, 3000);
  };

  const handleSkip = () => {
    // Go back to finding state to search for new partner
    setAppState("finding");
    setTimeout(() => {
      setAppState("connected");
    }, 2000);
  };

  const handleEnd = () => {
    setAppState("landing");
    setSelectedMode(null);
  };

  const handleCancel = () => {
    setAppState("landing");
    setSelectedMode(null);
  };

  // Render active chat screen based on mode
  if (appState === "connected" && selectedMode) {
    switch (selectedMode) {
      case "video":
        return <VideoCallScreen onSkip={handleSkip} onEnd={handleEnd} />;
      case "voice":
        return <VoiceCallScreen onSkip={handleSkip} onEnd={handleEnd} />;
      case "text":
        return (
          <TextChatScreen 
            onSkip={handleSkip} 
            onEnd={handleEnd}
            onUpgradeToVoice={() => setSelectedMode("voice")}
            onUpgradeToVideo={() => setSelectedMode("video")}
          />
        );
    }
  }

  // Finding screen
  if (appState === "finding" && selectedMode) {
    return <FindingScreen mode={selectedMode} onCancel={handleCancel} />;
  }

  // Landing page
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <GlassPanel className="p-8 max-w-md w-full" animate>
        <div className="space-y-8">
          <Header />
          <ModeSelection onSelectMode={handleSelectMode} />
          
          <p className="text-center text-xs text-muted-foreground/60">
            By using Senvo, you agree to our Terms of Service
          </p>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Index;
