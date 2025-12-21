-- Drop old tables and create new OMR system schema
-- Drop existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;

-- Create new tables for OMR system
CREATE TABLE test_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_questions INTEGER NOT NULL,
  test_mode VARCHAR(20) NOT NULL CHECK (test_mode IN ('timer', 'stopwatch')),
  time_limit_minutes INTEGER,
  allow_overtime BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_attempts (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER NOT NULL REFERENCES test_presets(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,
  overtime_seconds INTEGER,
  is_evaluated BOOLEAN DEFAULT false,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER,
  incorrect_answers INTEGER,
  unanswered INTEGER,
  percentage DECIMAL(5, 2)
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D', 'E')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(attempt_id, question_number)
);

CREATE TABLE answer_keys (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER UNIQUE NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  correct_answers JSONB NOT NULL,
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_test_attempts_preset_id ON test_attempts(preset_id);
CREATE INDEX idx_answers_attempt_id ON answers(attempt_id);
