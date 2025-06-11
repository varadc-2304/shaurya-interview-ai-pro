
-- Create interview_results table to store overall interview performance
CREATE TABLE IF NOT EXISTS public.interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  performance_level TEXT NOT NULL DEFAULT 'Pending',
  overall_recommendation TEXT NOT NULL DEFAULT 'Under Review',
  total_questions INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to interview_questions table for comprehensive evaluation storage
ALTER TABLE public.interview_questions 
ADD COLUMN IF NOT EXISTS user_text_response TEXT,
ADD COLUMN IF NOT EXISTS user_code_response TEXT,
ADD COLUMN IF NOT EXISTS response_language TEXT,
ADD COLUMN IF NOT EXISTS performance_level TEXT,
ADD COLUMN IF NOT EXISTS recommendation TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interview_results_user_id ON public.interview_results(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_interview_id ON public.interview_results(interview_id);

-- Enable RLS for interview_results
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_results (users can only see their own results)
CREATE POLICY "Users can view their own interview results" 
  ON public.interview_results 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview results" 
  ON public.interview_results 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview results" 
  ON public.interview_results 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create or replace function to calculate and store interview results
CREATE OR REPLACE FUNCTION public.calculate_interview_results(p_interview_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id UUID;
  v_user_id UUID;
  v_total_questions INTEGER;
  v_questions_answered INTEGER;
  v_average_score DECIMAL(5,2);
  v_overall_score INTEGER;
  v_performance_level TEXT;
  v_recommendation TEXT;
  v_duration_minutes INTEGER;
BEGIN
  -- Get interview details
  SELECT user_id INTO v_user_id 
  FROM public.interviews 
  WHERE id = p_interview_id;
  
  -- Count total questions and answered questions
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN evaluation_score IS NOT NULL THEN 1 END) as answered,
    COALESCE(AVG(evaluation_score), 0) as avg_score
  INTO v_total_questions, v_questions_answered, v_average_score
  FROM public.interview_questions 
  WHERE interview_id = p_interview_id;
  
  -- Calculate overall score (rounded average)
  v_overall_score := ROUND(v_average_score);
  
  -- Determine performance level
  v_performance_level := CASE 
    WHEN v_average_score >= 90 THEN 'Excellent'
    WHEN v_average_score >= 80 THEN 'Strong'
    WHEN v_average_score >= 70 THEN 'Good'
    WHEN v_average_score >= 60 THEN 'Satisfactory'
    ELSE 'Needs Improvement'
  END;
  
  -- Determine recommendation
  v_recommendation := CASE 
    WHEN v_average_score >= 80 THEN 'Strong Hire'
    WHEN v_average_score >= 70 THEN 'Hire'
    WHEN v_average_score >= 60 THEN 'Maybe'
    ELSE 'No Hire'
  END;
  
  -- Calculate duration (in minutes)
  SELECT 
    EXTRACT(EPOCH FROM (completed_at - created_at))/60
  INTO v_duration_minutes
  FROM public.interviews 
  WHERE id = p_interview_id AND completed_at IS NOT NULL;
  
  -- Insert or update interview results
  INSERT INTO public.interview_results (
    interview_id,
    user_id,
    overall_score,
    performance_level,
    overall_recommendation,
    total_questions,
    questions_answered,
    average_score,
    duration_minutes
  ) VALUES (
    p_interview_id,
    v_user_id,
    v_overall_score,
    v_performance_level,
    v_recommendation,
    v_total_questions,
    v_questions_answered,
    v_average_score,
    v_duration_minutes
  )
  ON CONFLICT (interview_id) 
  DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    performance_level = EXCLUDED.performance_level,
    overall_recommendation = EXCLUDED.overall_recommendation,
    questions_answered = EXCLUDED.questions_answered,
    average_score = EXCLUDED.average_score,
    duration_minutes = EXCLUDED.duration_minutes,
    updated_at = NOW()
  RETURNING id INTO v_result_id;
  
  RETURN v_result_id;
END;
$$;

-- Add unique constraint to ensure one result per interview
ALTER TABLE public.interview_results 
ADD CONSTRAINT unique_interview_result UNIQUE (interview_id);
