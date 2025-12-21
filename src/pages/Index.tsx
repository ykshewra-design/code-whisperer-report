import { useState, useEffect } from "react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";
import Header from "@/components/Header";
import ModeSelection, { ChatMode } from "@/components/ModeSelection";
import FindingScreen from "@/components/FindingScreen";
import VideoCallScreen from "@/components/chat/VideoCallScreen";
import VoiceCallScreen from "@/components/chat/VoiceCallScreen";
import TextChatScreen from "@/components/chat/TextChatScreen";
import { useMatching } from "@/hooks/useMatching";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { toast } from "sonner";

type AppState = "landing" | "finding" | "connected";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("landing");
  const [selectedMode, setSelectedMode] = useState<ChatMode | null>(null);
  
  const { 
    isSearching, 
    isMatched, 
    matchResult, 
    error: matchError,
    startSearching, 
    stopSearching,
    peerDisconnected 
  } = useMatching();
  
  const { 
    localStream, 
    requestMedia, 
    stopMedia,
    error: mediaError 
  } = useMediaDevices();

  // Handle mode selection
  const handleSelectMode = async (mode: ChatMode) => {
    setSelectedMode(mode);
    setAppState("finding");
    
    // Request media for video/voice modes
    if (mode === "video") {
      const success = await requestMedia({ video: true, audio: true });
      if (!success) {
        toast.error("Camera and microphone access required for video chat");
        setAppState("landing");
        setSelectedMode(null);
        return;
      }
    } else if (mode === "voice") {
      const success = await requestMedia({ video: false, audio: true });
      if (!success) {
        toast.error("Microphone access required for voice chat");
        setAppState("landing");
        setSelectedMode(null);
        return;
      }
    }
    
    // Start searching for a real match
    await startSearching(mode);
  };

  // Handle match found
  useEffect(() => {
    if (isMatched && matchResult) {
      console.log("Match found!", matchResult);
      setAppState("connected");
    }
  }, [isMatched, matchResult]);

  // Handle peer disconnect
  useEffect(() => {
    if (peerDisconnected && appState === "connected") {
      toast.info("The other person left the chat");
      handleEnd();
    }
  }, [peerDisconnected, appState]);

  // Handle match error
  useEffect(() => {
    if (matchError) {
      toast.error(matchError);
    }
  }, [matchError]);

  // Handle media error
  useEffect(() => {
    if (mediaError) {
      toast.error(mediaError);
    }
  }, [mediaError]);

  const handleEnd = async () => {
    await stopSearching();
    stopMedia();
    setAppState("landing");
    setSelectedMode(null);
  };

  const handleCancel = async () => {
    await stopSearching();
    stopMedia();
    setAppState("landing");
    setSelectedMode(null);
  };

  // Handle upgrade from text to voice/video
  const handleUpgradeToVoice = async () => {
    const success = await requestMedia({ video: false, audio: true });
    if (success) {
      setSelectedMode("voice");
    } else {
      toast.error("Microphone access required");
    }
  };

  const handleUpgradeToVideo = async () => {
    const success = await requestMedia({ video: true, audio: true });
    if (success) {
      setSelectedMode("video");
    } else {
      toast.error("Camera and microphone access required");
    }
  };

  // Determine if I'm the initiator (for WebRTC offer/answer)
  const isInitiator = matchResult ? matchResult.myId > (matchResult.peerId || '') : false;

  // Render active chat screen based on mode
  if (appState === "connected" && selectedMode && matchResult) {
    switch (selectedMode) {
      case "video":
        return (
          <VideoCallScreen 
            onEnd={handleEnd}
            localStream={localStream}
            roomId={matchResult.roomId}
            myUserId={matchResult.myId}
            peerId={matchResult.peerId}
            isInitiator={isInitiator}
          />
        );
      case "voice":
        return (
          <VoiceCallScreen 
            onEnd={handleEnd}
            localStream={localStream}
            roomId={matchResult.roomId}
            myUserId={matchResult.myId}
            peerId={matchResult.peerId}
            isInitiator={isInitiator}
          />
        );
      case "text":
        return (
          <TextChatScreen 
            onEnd={handleEnd}
            onUpgradeToVoice={handleUpgradeToVoice}
            onUpgradeToVideo={handleUpgradeToVideo}
            roomId={matchResult.roomId}
            myUserId={matchResult.myId}
            peerId={matchResult.peerId}
          />
        );
    }
  }

  // Finding screen - shows ONLY while searching, not auto-matching
  if (appState === "finding" && selectedMode) {
    return <FindingScreen mode={selectedMode} onCancel={handleCancel} isSearching={isSearching} />;
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
            No signup • No login • Instant connection
          </p>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Index;