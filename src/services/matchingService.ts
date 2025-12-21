import { supabase } from "@/integrations/supabase/client";
import { ChatMode } from "@/components/ModeSelection";

export interface MatchResult {
  matched: boolean;
  roomId: string | null;
  peerId: string | null;
  myId: string;
}

export interface QueueEntry {
  id: string;
  user_id: string;
  mode: string;
  status: string;
  matched_with: string | null;
  room_id: string | null;
  created_at: string;
  updated_at: string;
}

class MatchingService {
  private myQueueId: string | null = null;
  private myUserId: string | null = null;
  private subscription: ReturnType<typeof supabase.channel> | null = null;
  private onMatchCallback: ((result: MatchResult) => void) | null = null;
  private onPeerDisconnectCallback: (() => void) | null = null;

  // Generate a unique user ID for this session
  private generateUserId(): string {
    const stored = sessionStorage.getItem('senvo_user_id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem('senvo_user_id', id);
    return id;
  }

  // Join the matching queue for a specific mode
  async joinQueue(mode: ChatMode): Promise<string> {
    this.myUserId = this.generateUserId();
    
    // First, check if there's already someone waiting in this mode
    const { data: waitingUsers, error: fetchError } = await supabase
      .from('matching_queue')
      .select('*')
      .eq('mode', mode)
      .eq('status', 'waiting')
      .neq('user_id', this.myUserId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error checking queue:', fetchError);
      throw fetchError;
    }

    if (waitingUsers && waitingUsers.length > 0) {
      // Found a match! Create room and update both entries
      const partner = waitingUsers[0] as QueueEntry;
      const roomId = crypto.randomUUID();

      // Insert my entry as matched
      const { data: myEntry, error: insertError } = await supabase
        .from('matching_queue')
        .insert({
          user_id: this.myUserId,
          mode: mode,
          status: 'matched',
          matched_with: partner.id,
          room_id: roomId
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting queue entry:', insertError);
        throw insertError;
      }

      this.myQueueId = (myEntry as QueueEntry).id;

      // Update partner's entry to matched
      await supabase
        .from('matching_queue')
        .update({
          status: 'matched',
          matched_with: this.myQueueId,
          room_id: roomId,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      // Trigger callback immediately
      if (this.onMatchCallback) {
        this.onMatchCallback({
          matched: true,
          roomId: roomId,
          peerId: partner.user_id,
          myId: this.myUserId
        });
      }

      return this.myQueueId;
    }

    // No one waiting, add myself to queue
    const { data: myEntry, error: insertError } = await supabase
      .from('matching_queue')
      .insert({
        user_id: this.myUserId,
        mode: mode,
        status: 'waiting',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting queue entry:', insertError);
      throw insertError;
    }

    this.myQueueId = (myEntry as QueueEntry).id;

    // Subscribe to updates on my queue entry
    this.subscribeToMatches();

    return this.myQueueId;
  }

  // Subscribe to realtime updates for matching
  private subscribeToMatches() {
    if (!this.myQueueId) return;

    this.subscription = supabase
      .channel(`queue-${this.myQueueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matching_queue',
          filter: `id=eq.${this.myQueueId}`
        },
        (payload) => {
          const updated = payload.new as QueueEntry;
          console.log('Queue update received:', updated);
          
          if (updated.status === 'matched' && updated.room_id && updated.matched_with) {
            // Get partner's user_id
            this.getPartnerUserId(updated.matched_with).then(peerId => {
              if (this.onMatchCallback) {
                this.onMatchCallback({
                  matched: true,
                  roomId: updated.room_id!,
                  peerId: peerId,
                  myId: this.myUserId!
                });
              }
            });
          }
        }
      )
      .subscribe();
  }

  // Get partner's user_id from their queue entry
  private async getPartnerUserId(queueId: string): Promise<string> {
    const { data, error } = await supabase
      .from('matching_queue')
      .select('user_id')
      .eq('id', queueId)
      .single();

    if (error || !data) {
      console.error('Error getting partner user_id:', error);
      return '';
    }

    return (data as { user_id: string }).user_id;
  }

  // Set callback for when a match is found
  onMatch(callback: (result: MatchResult) => void) {
    this.onMatchCallback = callback;
  }

  // Set callback for when peer disconnects
  onPeerDisconnect(callback: () => void) {
    this.onPeerDisconnectCallback = callback;
  }

  // Subscribe to peer's queue entry to detect disconnect
  subscribeToRoomDisconnects(roomId: string) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'matching_queue',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log('Peer disconnected from room');
          if (this.onPeerDisconnectCallback) {
            this.onPeerDisconnectCallback();
          }
        }
      )
      .subscribe();

    return channel;
  }

  // Leave the queue
  async leaveQueue() {
    if (this.myQueueId) {
      await supabase
        .from('matching_queue')
        .delete()
        .eq('id', this.myQueueId);
      
      this.myQueueId = null;
    }

    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    this.onMatchCallback = null;
    this.onPeerDisconnectCallback = null;
  }

  // Get current user ID
  getMyUserId(): string | null {
    return this.myUserId;
  }

  // Get current queue ID
  getMyQueueId(): string | null {
    return this.myQueueId;
  }
}

export const matchingService = new MatchingService();
