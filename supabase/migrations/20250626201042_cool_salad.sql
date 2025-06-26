/*
  # Chat and AI Features

  1. New Tables
    - `chat_sessions` - Chat conversation sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `trip_id` (uuid, references trips, optional)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `chat_messages` - Individual chat messages
      - `id` (uuid, primary key)
      - `session_id` (uuid, references chat_sessions)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `message_type` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

    - `ai_generations` - Track AI generation requests
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `trip_id` (uuid, references trips, optional)
      - `generation_type` (text)
      - `input_data` (jsonb)
      - `output_data` (jsonb)
      - `status` (text)
      - `error_message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own chat data
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'options', 'form', 'map', 'summary')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  generation_type text NOT NULL CHECK (generation_type IN ('itinerary', 'chat_response', 'recommendations', 'safety_analysis')),
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can manage own chat sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can manage messages in own sessions"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Policies for ai_generations
CREATE POLICY "Users can manage own AI generations"
  ON ai_generations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_trip_id_idx ON chat_sessions(trip_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS ai_generations_user_id_idx ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS ai_generations_trip_id_idx ON ai_generations(trip_id);
CREATE INDEX IF NOT EXISTS ai_generations_status_idx ON ai_generations(status);