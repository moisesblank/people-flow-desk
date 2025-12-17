-- Create team_chat_messages table for internal team communication
CREATE TABLE public.team_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  reply_to UUID REFERENCES public.team_chat_messages(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for team chat
CREATE POLICY "Authenticated users can view all team messages"
  ON public.team_chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages"
  ON public.team_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON public.team_chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.team_chat_messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX idx_team_chat_created_at ON public.team_chat_messages(created_at DESC);

-- Enable realtime for team chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;

-- Create receipt_ocr_extractions table for OCR results
CREATE TABLE public.receipt_ocr_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  amount_detected NUMERIC(12, 2),
  date_detected DATE,
  vendor_detected TEXT,
  category_suggested TEXT,
  confidence_score NUMERIC(3, 2),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.receipt_ocr_extractions ENABLE ROW LEVEL SECURITY;

-- Policies for OCR extractions
CREATE POLICY "Users can view their own OCR extractions"
  ON public.receipt_ocr_extractions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create OCR extractions"
  ON public.receipt_ocr_extractions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OCR extractions"
  ON public.receipt_ocr_extractions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create automated_reports table for scheduled reports
CREATE TABLE public.automated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT 'weekly',
  recipients TEXT[] DEFAULT '{}',
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automated_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own automated reports"
  ON public.automated_reports
  FOR ALL
  USING (auth.uid() = user_id);