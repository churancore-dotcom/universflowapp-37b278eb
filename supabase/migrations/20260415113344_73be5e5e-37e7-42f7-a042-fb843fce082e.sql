
-- Create listening sessions table
CREATE TABLE public.listening_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  session_code text NOT NULL UNIQUE,
  current_song_data jsonb DEFAULT '{}'::jsonb,
  is_playing boolean NOT NULL DEFAULT false,
  playback_position numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create session members table
CREATE TABLE public.listening_session_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.listening_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_session_members ENABLE ROW LEVEL SECURITY;

-- Listening sessions policies
CREATE POLICY "Authenticated users can create sessions"
ON public.listening_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Anyone authenticated can view active sessions"
ON public.listening_sessions FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Host can update their session"
ON public.listening_sessions FOR UPDATE TO authenticated
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host can delete their session"
ON public.listening_sessions FOR DELETE TO authenticated
USING (auth.uid() = host_user_id);

-- Session members policies
CREATE POLICY "Authenticated users can join sessions"
ON public.listening_session_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view session members"
ON public.listening_session_members FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.listening_session_members sm
  WHERE sm.session_id = listening_session_members.session_id
  AND sm.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.listening_sessions ls
  WHERE ls.id = listening_session_members.session_id
  AND ls.host_user_id = auth.uid()
));

CREATE POLICY "Users can leave sessions"
ON public.listening_session_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for live sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.listening_sessions;

-- Trigger for updated_at
CREATE TRIGGER update_listening_sessions_updated_at
BEFORE UPDATE ON public.listening_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
