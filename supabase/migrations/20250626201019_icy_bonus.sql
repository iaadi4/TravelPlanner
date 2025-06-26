/*
  # Trip Management System

  1. New Tables
    - `trips` - Main trip information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `destination` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `budget` (numeric)
      - `travelers` (integer)
      - `status` (text)
      - `preferences` (jsonb)
      - `share_id` (uuid, optional for sharing)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `itinerary_days` - Daily itinerary plans
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips)
      - `day_number` (integer)
      - `date` (date)
      - `notes` (text)
      - `budget` (numeric)

    - `activities` - Individual activities
      - `id` (uuid, primary key)
      - `itinerary_day_id` (uuid, references itinerary_days)
      - `name` (text)
      - `type` (text)
      - `description` (text)
      - `time_slot` (text)
      - `duration` (integer)
      - `cost` (numeric)
      - `rating` (numeric)
      - `location` (jsonb)
      - `booking_url` (text)
      - `images` (text[])
      - `tips` (text[])

  2. Security
    - Enable RLS on all tables
    - Users can only access their own trips
    - Shared trips can be viewed by anyone with share_id
*/

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Trip',
  destination text DEFAULT '',
  start_date date,
  end_date date,
  budget numeric DEFAULT 0,
  travelers integer DEFAULT 1 CHECK (travelers > 0),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'completed', 'cancelled')),
  preferences jsonb DEFAULT '{}',
  share_id uuid UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create itinerary_days table
CREATE TABLE IF NOT EXISTS itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL CHECK (day_number > 0),
  date date NOT NULL,
  notes text DEFAULT '',
  budget numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, day_number)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_day_id uuid REFERENCES itinerary_days(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'attraction' CHECK (type IN ('attraction', 'experience', 'tour', 'rest', 'meal', 'transport')),
  description text DEFAULT '',
  time_slot text DEFAULT '',
  duration integer DEFAULT 60 CHECK (duration > 0),
  cost numeric DEFAULT 0,
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  location jsonb DEFAULT '{}',
  booking_url text,
  images text[] DEFAULT '{}',
  tips text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policies for trips
CREATE POLICY "Users can read own trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for shared trips (public read access with share_id)
CREATE POLICY "Anyone can read shared trips"
  ON trips
  FOR SELECT
  TO anon, authenticated
  USING (share_id IS NOT NULL);

-- Policies for itinerary_days
CREATE POLICY "Users can manage itinerary days for own trips"
  ON itinerary_days
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Public read access for shared itinerary days
CREATE POLICY "Anyone can read shared itinerary days"
  ON itinerary_days
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.share_id IS NOT NULL
    )
  );

-- Policies for activities
CREATE POLICY "Users can manage activities for own trips"
  ON activities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.user_id = auth.uid()
    )
  );

-- Public read access for shared activities
CREATE POLICY "Anyone can read shared activities"
  ON activities
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.share_id IS NOT NULL
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_days_updated_at
  BEFORE UPDATE ON itinerary_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_share_id_idx ON trips(share_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS itinerary_days_trip_id_idx ON itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS activities_itinerary_day_id_idx ON activities(itinerary_day_id);