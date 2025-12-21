import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'video';
  media_url: string | null;
  created_at: string;
}

class ChatService {
  private subscription: ReturnType<typeof supabase.channel> | null = null;
  private onMessageCallback: ((message: ChatMessage) => void) | null = null;
  private roomId: string | null = null;
  private myUserId: string | null = null;

  // Initialize chat for a room
  init(roomId: string, myUserId: string) {
    this.roomId = roomId;
    this.myUserId = myUserId;
    this.subscribeToMessages();
  }

  // Subscribe to incoming messages
  private subscribeToMessages() {
    if (!this.roomId) return;

    this.subscription = supabase
      .channel(`chat-${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${this.roomId}`
        },
        (payload) => {
          const message = payload.new as ChatMessage;
          console.log('Message received:', message);
          
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        }
      )
      .subscribe();
  }

  // Send a text message
  async sendMessage(content: string): Promise<ChatMessage | null> {
    if (!this.roomId || !this.myUserId) {
      console.error('Chat not initialized');
      return null;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: this.roomId,
        sender_id: this.myUserId,
        content: content,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data as ChatMessage;
  }

  // Send a media message (image or video)
  async sendMediaMessage(file: File, type: 'image' | 'video'): Promise<ChatMessage | null> {
    if (!this.roomId || !this.myUserId) {
      console.error('Chat not initialized');
      return null;
    }

    // For now, we'll create a local URL for the media
    // In production, you'd upload to storage first
    const mediaUrl = URL.createObjectURL(file);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: this.roomId,
        sender_id: this.myUserId,
        message_type: type,
        media_url: mediaUrl
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending media message:', error);
      throw error;
    }

    return data as ChatMessage;
  }

  // Get chat history
  async getHistory(): Promise<ChatMessage[]> {
    if (!this.roomId) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', this.roomId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }

    return (data || []) as ChatMessage[];
  }

  // Set callback for incoming messages
  onMessage(callback: (message: ChatMessage) => void) {
    this.onMessageCallback = callback;
  }

  // Get my user ID
  getMyUserId(): string | null {
    return this.myUserId;
  }

  // Cleanup
  cleanup() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    this.onMessageCallback = null;
    this.roomId = null;
    this.myUserId = null;
  }
}

export const chatService = new ChatService();
