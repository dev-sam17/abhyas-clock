-- Add input type and starting question columns to test_presets table

ALTER TABLE test_presets 
ADD COLUMN starting_question INT DEFAULT 1 NOT NULL,
ADD COLUMN input_type VARCHAR(10) DEFAULT 'radio' NOT NULL;

-- Update answers table to support longer text answers (for text input type)
ALTER TABLE answers 
ALTER COLUMN selected_answer TYPE VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN test_presets.starting_question IS 'The first question number (e.g., 21 means questions go from 21 to 21+totalQuestions-1)';
COMMENT ON COLUMN test_presets.input_type IS 'Type of answer input: radio (A/B/C/D/E) or text (free text input)';
