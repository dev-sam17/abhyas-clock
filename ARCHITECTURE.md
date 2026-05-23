# Abhyas Clock - Architecture & Data Flow Documentation

## Overview

Abhyas Clock is an **Online OMR Sheet System** designed for students practicing offline competitive exams. The app focuses on **question numbering, time tracking, and analytics** - not question content.

### Key Concept
Students take exams using physical/offline question papers, then enter their answers online through an OMR interface. After completion, they manually enter correct answers for evaluation and analytics.

---

## Database Schema & Models

### 1. **TestPreset** (Test Configuration)
The blueprint for a test. Created once, reused for multiple attempts.

```
TestPreset
├── id: Unique identifier
├── name: Test name (e.g., "NEET Biology Mock")
├── totalQuestions: Number of questions (e.g., 50)
├── startingQuestion: First question number (e.g., 21)
│   └── Last Q# calculated as: startingQuestion + totalQuestions - 1
├── inputType: "radio" (A-E options) or "text" (free-form answers)
├── testMode: "timer" (countdown) or "stopwatch" (unlimited)
├── timeLimitMinutes: Duration (timer mode only)
├── allowOvertime: Track time beyond limit? (timer mode only)
└── Relations:
    ├── presetAnswerKey (1:1) → Correct answers stored after first attempt
    └── attempts (1:many) → All student test attempts using this preset
```

**Use Case**: User creates a preset once. Every time they take the test, they use this same preset.

---

### 2. **TestAttempt** (Student's Test Session)
Records a student's test-taking session from start to submission.

```
TestAttempt
├── id: Unique identifier for this attempt
├── presetId: Links to TestPreset (FK)
├── startedAt: When student started the test
├── completedAt: When student submitted answers
├── timeTakenSeconds: Total time spent
├── overtimeSeconds: Extra time if exceeded limit (timer mode)
├── isEvaluated: false = waiting for answer key, true = evaluated
├── Scores (populated after evaluation):
│   ├── correctAnswers: Count of correct answers
│   ├── incorrectAnswers: Count of wrong answers
│   ├── unanswered: Count of skipped questions
│   └── percentage: Accuracy %
└── Relations:
    ├── preset (many:1) → Belongs to a TestPreset
    ├── answers (1:many) → All answers submitted in this attempt
    └── answerKey (1:1) → Correct answers entered for this attempt
```

**Use Case**: User completes a test → 1 TestAttempt created → Answers submitted → isEvaluated = false → User enters correct answers → isEvaluated = true + scores calculated.

---

### 3. **Answer** (Student's Answer to One Question)
Individual answer for each question in an attempt.

```
Answer
├── id: Unique identifier
├── attemptId: Links to TestAttempt (FK)
├── questionNumber: Q# (e.g., 21, 22, 23...)
├── selectedAnswer: Student's answer
│   └── "A", "B", "C", "D", "E" (if inputType = "radio")
│   └── Any text (if inputType = "text")
├── isCorrect: null (before evaluation), true/false (after)
├── answeredAt: Timestamp when answered
└── Relations:
    └── attempt (many:1) → Belongs to a TestAttempt
```

**Use Case**: When student selects "C" for Q21 → Answer record created with selectedAnswer="C" → After answer key entry → isCorrect calculated.

---

### 4. **AnswerKey** (Correct Answers for One Attempt)
Stores correct answers entered by user AFTER test completion (legacy support).

```
AnswerKey
├── id: Unique identifier
├── attemptId: Links to TestAttempt (FK) - UNIQUE
├── correctAnswers: JSON array ["A", "B", "C", "D", ...] (one per question)
├── enteredAt: When user submitted correct answers
└── Relations:
    └── attempt (1:1) → Belongs to a TestAttempt
```

**Deprecated Note**: This is primarily for legacy support. The `PresetAnswerKey` is now the primary storage.

---

### 5. **PresetAnswerKey** (Persistent Correct Answers)
Stores the correct answer key at preset level (created after first attempt).

```
PresetAnswerKey
├── id: Unique identifier
├── presetId: Links to TestPreset (FK) - UNIQUE
├── correctAnswers: JSON array ["A", "B", "C", "D", ...] (one per question)
├── createdAt: When first entered
├── updatedAt: When last updated
└── Relations:
    └── preset (1:1) → Belongs to a TestPreset
```

**Key Benefit**: User enters answer key only ONCE. For all future attempts of the same preset, answers are auto-evaluated using this stored key.

---

### 6. **User, Session, Account, Verification** (Authentication)
Standard Better Auth models for Google OAuth integration.
- User: Stores user profile
- Session: Active user sessions
- Account: OAuth provider credentials
- Verification: Email verification tokens

---

## Data Flow & User Journey

### Scenario 1: First Time Taking a Test

```
1. User creates preset
   └─ Creates: TestPreset (name, questions, time, input type)
   
2. User takes test (OMR interface)
   ├─ Creates: TestAttempt (not yet evaluated)
   ├─ For each question:
   │  └─ Creates: Answer (selectedAnswer recorded, isCorrect = null)
   └─ Submits answers
   
3. User enters correct answers (Answer Key page)
   └─ POST /api/answer-key
      ├─ Creates: PresetAnswerKey (stored at preset level)
      ├─ Creates: AnswerKey (attempt-level, legacy)
      ├─ Updates all Answer records (calculates isCorrect)
      └─ Updates TestAttempt (scores, percentage, isEvaluated = true)
```

**Database State After**:
- TestPreset: 1 record with answerKey
- TestAttempt: 1 evaluated attempt
- Answer: 50 records, each with isCorrect = true/false
- PresetAnswerKey: 1 record with correct answers

---

### Scenario 2: Retaking the Same Test

```
1. User retakes same preset
   └─ Creates: TestAttempt #2 (not yet evaluated)
   
2. User answers questions
   ├─ For each question:
   │  └─ Creates: Answer (selectedAnswer recorded)
   └─ Submits answers
   
3. System auto-evaluates (because PresetAnswerKey exists)
   ├─ Fetches: PresetAnswerKey.correctAnswers
   ├─ Automatically:
   │  ├─ Updates all Answer records (calculates isCorrect)
   │  └─ Updates TestAttempt (scores, isEvaluated = true)
   └─ No user input needed!
```

**Note**: In current implementation, user still needs to enter answer key (manual flow). Auto-evaluation can be triggered on attempt submission if PresetAnswerKey exists.

---

## Feature-Specific Data Flows

### Feature 1: Timer vs Stopwatch

**Timer Mode**:
- TestPreset.timeLimitMinutes = 30
- OMR interface: countdown timer
- User can submit anytime
- If submitted after time limit:
  - TestAttempt.overtimeSeconds = actual_seconds - (timeLimitMinutes * 60)
  - Stored for analytics

**Stopwatch Mode**:
- TestPreset.timeLimitMinutes = null
- OMR interface: stopwatch (no limit)
- Timer counts up
- TestAttempt.overtimeSeconds = null

---

### Feature 2: Input Types

**Radio Type** (Default):
```
TestPreset.inputType = "radio"

Answer.selectedAnswer = "A" | "B" | "C" | "D" | "E"
OMR UI: Radio buttons for each option
```

**Text Type**:
```
TestPreset.inputType = "text"

Answer.selectedAnswer = "Any free-form text"
OMR UI: Text input field
Evaluation: String comparison (case-sensitive)
```

---

### Feature 3: Question Numbering

```
TestPreset:
├── startingQuestion = 21
└── totalQuestions = 50
└── Last question = 21 + 50 - 1 = 70

OMR UI displays: Q21, Q22, Q23, ..., Q70 (not Q1, Q2, Q3...)

Answer.questionNumber = 21 (not array index 0)
```

**Array Mapping**:
```
correctAnswers[0] = Answer for Q21
correctAnswers[1] = Answer for Q22
...
correctAnswers[49] = Answer for Q70

Calculation: arrayIndex = questionNumber - startingQuestion
```

---

## API Endpoints & Their Data Flow

### POST `/api/presets`
**Input**: name, totalQuestions, startingQuestion, inputType, testMode, timeLimitMinutes, allowOvertime
**Creates**: TestPreset
**Output**: Preset ID and details

---

### GET `/api/presets`
**Creates**: Nothing
**Retrieves**: All TestPresets with attempt count
**Output**: Array of presets

---

### POST `/api/attempts`
**Input**: presetId, timeTakenSeconds, overtimeSeconds, totalQuestions, answers[]
**Creates**: 
  - TestAttempt (isEvaluated = false initially)
  - Answer records (one per question)
**Output**: attemptId
**Data State**: Attempt saved but not evaluated yet

---

### POST `/api/answer-key`
**Input**: attemptId, correctAnswers[]
**Retrieves**: 
  - TestAttempt and its answers
  - Check if PresetAnswerKey exists
**Creates/Updates**:
  - PresetAnswerKey (upsert - create if not exists, update if exists)
  - AnswerKey (legacy support)
  - Updates all Answer records with isCorrect
  - Updates TestAttempt with scores and isEvaluated = true
**Output**: Results (correct count, incorrect, unanswered, percentage)
**Key Operation**: TRANSACTION ensures all-or-nothing update

---

## Analytics Data Sources

### Per-Preset Analytics
```sql
SELECT 
  preset_id,
  COUNT(*) as total_attempts,
  AVG(time_taken_seconds) as avg_time,
  AVG(percentage) as avg_accuracy,
  MAX(percentage) as best_score,
  MIN(percentage) as worst_score
FROM test_attempts
WHERE is_evaluated = true AND preset_id = X
```

### Per-Question Analytics (Across All Attempts)
```sql
SELECT 
  question_number,
  COUNT(*) as times_asked,
  SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as times_correct,
  (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) / COUNT(*)) as accuracy
FROM answers
WHERE attempt_id IN (
  SELECT id FROM test_attempts 
  WHERE preset_id = X AND is_evaluated = true
)
GROUP BY question_number
ORDER BY accuracy ASC
```

### Time Analysis
```sql
SELECT 
  preset_id,
  AVG(time_taken_seconds) as avg_time,
  AVG(overtime_seconds) as avg_overtime,
  MAX(time_taken_seconds) as longest_attempt,
  MIN(time_taken_seconds) as fastest_attempt
FROM test_attempts
WHERE is_evaluated = true
```

---

## Key Design Patterns

### 1. **Preset-Level Answer Key (Efficiency)**
Instead of storing answer key per attempt, store at preset level:
- First attempt: User enters answer key → Stored in PresetAnswerKey
- Second+ attempt: System fetches from PresetAnswerKey → Auto-evaluates
- Benefit: No need to re-enter answers for retakes

### 2. **Transaction Safety**
Answer key submission uses `prisma.$transaction`:
- Updates are atomic (all succeed or all fail)
- Prevents partial data inconsistency

### 3. **Flexible Input Types**
Same schema supports both:
- Multiple choice (A-E radio buttons)
- Free-form text answers
- Determined at preset creation, not per question

### 4. **Question Numbering Decoupling**
Questions stored with their actual number (21, 22, 23), not array indices (0, 1, 2):
- Supports non-sequential question sets
- Better matches real exam papers
- Easier for manual cross-referencing

---

## Database Relationships Diagram

```
┌──────────────────┐
│  TestPreset      │
├──────────────────┤
│ id               │ (PK)
│ name             │
│ totalQuestions   │
│ startingQuestion │
│ inputType        │
│ testMode         │
│ timeLimitMinutes │
│ allowOvertime    │
└─────┬──────┬────┘
      │ 1:1  │ 1:many
      │      │
   ┌──▼──┐ ┌─▼─────────┐
   │ PAK │ │ Attempt 1  │
   └─────┘ ├────────────┤
           │ id         │
           │ presetId   │
           │ isEvaluated│
           │ scores     │
           └─────┬──────┘
                 │ 1:many
                 │
            ┌────▼──────┐
            │ Answer     │
            ├────────────┤
            │ id         │
            │ attemptId  │
            │ questionNo │
            │ selected   │
            │ isCorrect  │
            └────────────┘

PAK = PresetAnswerKey (stores correct answers once for all attempts)
```

---

## Summary Table

| Model | Purpose | Creation Trigger | Cardinality |
|-------|---------|------------------|------------|
| TestPreset | Test config | User clicks "Create Preset" | 1 per test |
| PresetAnswerKey | Persistent answer key | User enters answers (first time) | 1 per preset |
| TestAttempt | Student's attempt | User takes test | Many per preset |
| Answer | One question's answer | Student selects/enters answer | Many per attempt |
| AnswerKey | Legacy answer key | User enters answers | 0 or 1 per attempt |
| User | Student profile | Google OAuth login | 1 per student |

---

This architecture ensures:
- **Efficiency**: Answer keys stored once, reused for multiple attempts
- **Flexibility**: Supports radio buttons, text input, any question numbering
- **Scalability**: Proper indexing on frequently queried fields
- **Data Integrity**: Transaction safety for evaluation
- **Analytics**: Rich data for detailed performance analysis
