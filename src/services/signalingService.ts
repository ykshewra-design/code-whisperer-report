import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type SignalType = 'offer' | 'answer' | 'ice-candidate';

export interface Signal {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  type: SignalType;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

class SignalingService {
  private subscription: ReturnType<typeof supabase.channel> | null = null;
  private onSignalCallback: ((signal: Signal) => void) | null = null;
  private myUserId: string | null = null;
  private roomId: string | null = null;

  // Initialize signaling for a room
  init(roomId: string, myUserId: string) {
    this.roomId = roomId;
    this.myUserId = myUserId;
    this.subscribeToSignals();
  }

  // Subscribe to incoming signals
  private subscribeToSignals() {
    if (!this.roomId || !this.myUserId) return;

    this.subscription = supabase
      .channel(`signals-${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling',
          filter: `room_id=eq.${this.roomId}`
        },
        (payload) => {
          const signal = payload.new as Signal;
          console.log('Signal received:', signal.type);
          
          // Only process signals meant for me
          if (signal.receiver_id === this.myUserId && this.onSignalCallback) {
            this.onSignalCallback(signal);
          }
        }
      )
      .subscribe();
  }

  // Send a signal to peer
  async sendSignal(
    receiverId: string, 
    type: SignalType, 
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit
  ) {
    if (!this.roomId || !this.myUserId) {
      console.error('Signaling not initialized');
      return;
    }

    const { error } = await supabase
      .from('signaling')
      .insert([{
        room_id: this.roomId,
        sender_id: this.myUserId,
        receiver_id: receiverId,
        type: type as string,
        payload: payload as Json
      }]);

    if (error) {
      console.error('Error sending signal:', error);
      throw error;
    }

    console.log('Signal sent:', type);
  }

  // Set callback for incoming signals
  onSignal(callback: (signal: Signal) => void) {
    this.onSignalCallback = callback;
  }

  // Cleanup
  cleanup() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    this.onSignalCallback = null;
    this.roomId = null;
    this.myUserId = null;
  }
}

export const signalingService = new SignalingService();
