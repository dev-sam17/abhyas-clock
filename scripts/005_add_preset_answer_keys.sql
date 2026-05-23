-- Create preset_answer_keys table for storing correct answers at preset level
CREATE TABLE IF NOT EXISTS preset_answer_keys (
  id SERIAL PRIMARY KEY,
  preset_id INT UNIQUE NOT NULL,
  correct_answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (preset_id) REFERENCES test_presets(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_preset_answer_keys_preset_id ON preset_answer_keys(preset_id);
