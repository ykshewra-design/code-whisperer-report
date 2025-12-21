import { useState, useEffect, useRef, useCallback } from 'react';
import { signalingService, Signal } from '@/services/signalingService';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

interface UseWebRTCProps {
  roomId: string | null;
  myUserId: string | null;
  peerId: string | null;
  isInitiator: boolean;
  localStream: MediaStream | null;
}

interface UseWebRTCReturn {
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  isConnected: boolean;
  error: string | null;
}

export const useWebRTC = ({
  roomId,
  myUserId,
  peerId,
  isInitiator,
  localStream,
}: UseWebRTCProps): UseWebRTCReturn => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && peerId) {
        console.log('Sending ICE candidate');
        signalingService.sendSignal(peerId, 'ice-candidate', event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received');
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
      
      if (pc.connectionState === 'failed') {
        setError('Connection failed. Please try again.');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected') {
        // Try to reconnect
        pc.restartIce();
      }
    };

    return pc;
  }, [peerId]);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: Signal) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        console.log('Received offer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        
        // Process pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
        
        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (peerId) {
          await signalingService.sendSignal(peerId, 'answer', answer);
        }
      } else if (signal.type === 'answer') {
        console.log('Received answer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
        
        // Process pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
      } else if (signal.type === 'ice-candidate') {
        console.log('Received ICE candidate');
        const candidate = signal.payload as RTCIceCandidateInit;
        
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    } catch (err) {
      console.error('Error handling signal:', err);
      setError('Connection error. Please try again.');
    }
  }, [peerId]);

  // Initialize WebRTC
  useEffect(() => {
    if (!roomId || !myUserId || !peerId) return;

    console.log('Initializing WebRTC', { roomId, myUserId, peerId, isInitiator });
    
    // Initialize signaling
    signalingService.init(roomId, myUserId);
    signalingService.onSignal(handleSignal);

    // Create peer connection
    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // If initiator, create and send offer
    if (isInitiator) {
      const createOffer = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await signalingService.sendSignal(peerId, 'offer', offer);
          console.log('Offer sent');
        } catch (err) {
          console.error('Error creating offer:', err);
          setError('Failed to create connection. Please try again.');
        }
      };
      
      // Small delay to ensure peer is ready
      setTimeout(createOffer, 1000);
    }

    return () => {
      console.log('Cleaning up WebRTC');
      pc.close();
      peerConnectionRef.current = null;
      signalingService.cleanup();
      setRemoteStream(null);
      setIsConnected(false);
      setConnectionState(null);
    };
  }, [roomId, myUserId, peerId, isInitiator, localStream, createPeerConnection, handleSignal]);

  return {
    remoteStream,
    connectionState,
    isConnected,
    error,
  };
};
