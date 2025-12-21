-- Create matching queue table for real-time user matching
CREATE TABLE public.matching_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL CHECK (mode IN ('video', 'voice', 'text')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched')),
  matched_with UUID REFERENCES public.matching_queue(id),
  room_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queue lookups
CREATE INDEX idx_matching_queue_mode_status ON public.matching_queue(mode, status);
CREATE INDEX idx_matching_queue_room ON public.matching_queue(room_id);

-- Enable Row Level Security
ALTER TABLE public.matching_queue ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read queue (needed for matching)
CREATE POLICY "Anyone can read queue" 
ON public.matching_queue 
FOR SELECT 
USING (true);

-- Allow anyone to insert into queue (anonymous users)
CREATE POLICY "Anyone can join queue" 
ON public.matching_queue 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update their own entry
CREATE POLICY "Anyone can update their entry" 
ON public.matching_queue 
FOR UPDATE 
USING (true);

-- Allow anyone to delete their own entry
CREATE POLICY "Anyone can leave queue" 
ON public.matching_queue 
FOR DELETE 
USING (true);

-- Create signaling table for WebRTC
CREATE TABLE public.signaling (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate')),
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster signaling lookups
CREATE INDEX idx_signaling_room ON public.signaling(room_id);
CREATE INDEX idx_signaling_receiver ON public.signaling(receiver_id);

-- Enable Row Level Security
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read signals for their room
CREATE POLICY "Anyone can read signals" 
ON public.signaling 
FOR SELECT 
USING (true);

-- Allow anyone to send signals
CREATE POLICY "Anyone can send signals" 
ON public.signaling 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete old signals
CREATE POLICY "Anyone can delete signals" 
ON public.signaling 
FOR DELETE 
USING (true);

-- Create messages table for text chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster message lookups
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone in the room to read messages
CREATE POLICY "Anyone can read messages" 
ON public.chat_messages 
FOR SELECT 
USING (true);

-- Allow anyone to send messages
CREATE POLICY "Anyone can send messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.matching_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Function to clean up old queue entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_queue_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.matching_queue 
  WHERE created_at < now() - interval '1 hour';
  
  DELETE FROM public.signaling 
  WHERE created_at < now() - interval '1 hour';
END;
$$;