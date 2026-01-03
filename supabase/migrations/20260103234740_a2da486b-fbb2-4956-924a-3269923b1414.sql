-- Add legacy_qr_id field to lessons table for QR Code resolution
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS legacy_qr_id INTEGER UNIQUE;

-- Create index for fast QR lookup
CREATE INDEX IF NOT EXISTS idx_lessons_legacy_qr_id ON public.lessons(legacy_qr_id) WHERE legacy_qr_id IS NOT NULL;

-- Add comment explaining the field purpose
COMMENT ON COLUMN public.lessons.legacy_qr_id IS 'Internal legacy identifier used by QR Codes printed in physical books. Immutable after creation.';