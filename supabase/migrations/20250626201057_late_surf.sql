/*
  # Travel Data Caching System

  1. New Tables
    - `cached_locations` - Cache location data from APIs
      - `id` (uuid, primary key)
      - `name` (text)
      - `location_type` (text)
      - `coordinates` (point)
      - `address` (text)
      - `place_id` (text)
      - `data` (jsonb)
      - `last_updated` (timestamp)

    - `cached_weather` - Cache weather data
      - `id` (uuid, primary key)
      - `location` (text)
      - `coordinates` (point)
      - `weather_data` (jsonb)
      - `forecast_data` (jsonb)
      - `last_updated` (timestamp)

    - `cached_safety_data` - Cache safety information
      - `id` (uuid, primary key)
      - `location` (text)
      - `safety_level` (integer)
      - `alerts` (jsonb)
      - `recommendations` (jsonb)
      - `last_updated` (timestamp)

  2. Security
    - Public read access for cached data
    - Service role can manage cache
*/

-- Enable PostGIS extension for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create cached_locations table
CREATE TABLE IF NOT EXISTS cached_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_type text DEFAULT 'general' CHECK (location_type IN ('general', 'hotel', 'restaurant', 'attraction', 'airport')),
  coordinates point,
  address text,
  place_id text UNIQUE,
  data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

-- Create cached_weather table
CREATE TABLE IF NOT EXISTS cached_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  coordinates point,
  weather_data jsonb DEFAULT '{}',
  forecast_data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  UNIQUE(location)
);

-- Create cached_safety_data table
CREATE TABLE IF NOT EXISTS cached_safety_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  safety_level integer CHECK (safety_level >= 1 AND safety_level <= 10),
  alerts jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  last_updated timestamptz DEFAULT now(),
  UNIQUE(location)
);

-- Enable RLS
ALTER TABLE cached_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_safety_data ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read cached locations"
  ON cached_locations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read cached weather"
  ON cached_weather
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read cached safety data"
  ON cached_safety_data
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role can manage all cache data
CREATE POLICY "Service role can manage cached locations"
  ON cached_locations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage cached weather"
  ON cached_weather
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage cached safety data"
  ON cached_safety_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS cached_locations_name_idx ON cached_locations(name);
CREATE INDEX IF NOT EXISTS cached_locations_type_idx ON cached_locations(location_type);
CREATE INDEX IF NOT EXISTS cached_locations_place_id_idx ON cached_locations(place_id);
CREATE INDEX IF NOT EXISTS cached_locations_coordinates_idx ON cached_locations USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS cached_weather_location_idx ON cached_weather(location);
CREATE INDEX IF NOT EXISTS cached_weather_coordinates_idx ON cached_weather USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS cached_safety_data_location_idx ON cached_safety_data(location);

-- Function to clean old cache data
CREATE OR REPLACE FUNCTION clean_old_cache_data()
RETURNS void AS $$
BEGIN
  -- Clean weather data older than 1 hour
  DELETE FROM cached_weather 
  WHERE last_updated < now() - interval '1 hour';
  
  -- Clean safety data older than 24 hours
  DELETE FROM cached_safety_data 
  WHERE last_updated < now() - interval '24 hours';
  
  -- Clean location data older than 7 days
  DELETE FROM cached_locations 
  WHERE last_updated < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;