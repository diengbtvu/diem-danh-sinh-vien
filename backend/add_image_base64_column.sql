-- Add imageBase64 column to attendances table
-- This script is for manual execution if needed
-- Note: With hibernate.ddl-auto=update, this column should be created automatically

USE attendance;

-- Add the imageBase64 column if it doesn't exist
ALTER TABLE attendances 
ADD COLUMN IF NOT EXISTS image_base64 LONGTEXT 
COMMENT 'Base64 encoded image data from attendance submission';

-- Optional: Create index on session_id and mssv for better query performance
CREATE INDEX IF NOT EXISTS idx_attendances_session_mssv ON attendances(session_id, mssv);

-- Verify the column was added
DESCRIBE attendances;