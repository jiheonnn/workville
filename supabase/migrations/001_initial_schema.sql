-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  character_type INTEGER CHECK (character_type >= 1 AND character_type <= 4),
  level INTEGER DEFAULT 1,
  total_work_hours DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Work sessions tracking
CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Real-time user status
CREATE TABLE user_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('working', 'home', 'break')) DEFAULT 'home',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Work logs
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Shared work log template
CREATE TABLE work_log_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL DEFAULT '## 오늘 한 일
- 

## 내일 할 일
- 

## 이슈 및 특이사항
- ',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default template
INSERT INTO work_log_template (id) VALUES (uuid_generate_v4());

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_log_template ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Everyone can read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Work sessions: Everyone can read, users can insert/update their own
CREATE POLICY "Work sessions are viewable by everyone" ON work_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own work sessions" ON work_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work sessions" ON work_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- User status: Everyone can read, users can update their own
CREATE POLICY "User status is viewable by everyone" ON user_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own status" ON user_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status" ON user_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Work logs: Everyone can read all logs
CREATE POLICY "Work logs are viewable by everyone" ON work_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can create own work logs" ON work_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Template: Everyone can read and update
CREATE POLICY "Template is viewable by everyone" ON work_log_template
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update template" ON work_log_template
  FOR UPDATE USING (true);

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_log_template_updated_at BEFORE UPDATE ON work_log_template
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_status_updated_at BEFORE UPDATE ON user_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.email);
  
  INSERT INTO user_status (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();