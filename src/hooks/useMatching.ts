import { useState, useEffect, useCallback } from 'react';
import { matchingService, MatchResult } from '@/services/matchingService';
import { ChatMode } from '@/components/ModeSelection';

interface UseMatchingReturn {
  isSearching: boolean;
  isMatched: boolean;
  matchResult: MatchResult | null;
  error: string | null;
  startSearching: (mode: ChatMode) => Promise<void>;
  stopSearching: () => Promise<void>;
  peerDisconnected: boolean;
}

export const useMatching = (): UseMatchingReturn => {
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [peerDisconnected, setPeerDisconnected] = useState(false);

  const startSearching = useCallback(async (mode: ChatMode) => {
    try {
      setIsSearching(true);
      setIsMatched(false);
      setMatchResult(null);
      setError(null);
      setPeerDisconnected(false);

      // Set up match callback before joining queue
      matchingService.onMatch((result) => {
        console.log('Match found:', result);
        setMatchResult(result);
        setIsMatched(true);
        setIsSearching(false);

        // Subscribe to peer disconnect
        if (result.roomId) {
          matchingService.subscribeToRoomDisconnects(result.roomId);
        }
      });

      matchingService.onPeerDisconnect(() => {
        console.log('Peer disconnected');
        setPeerDisconnected(true);
      });

      await matchingService.joinQueue(mode);
    } catch (err) {
      console.error('Error starting search:', err);
      setError('Failed to start searching. Please try again.');
      setIsSearching(false);
    }
  }, []);

  const stopSearching = useCallback(async () => {
    try {
      await matchingService.leaveQueue();
      setIsSearching(false);
      setIsMatched(false);
      setMatchResult(null);
      setPeerDisconnected(false);
    } catch (err) {
      console.error('Error stopping search:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      matchingService.leaveQueue();
    };
  }, []);

  return {
    isSearching,
    isMatched,
    matchResult,
    error,
    startSearching,
    stopSearching,
    peerDisconnected,
  };
};
