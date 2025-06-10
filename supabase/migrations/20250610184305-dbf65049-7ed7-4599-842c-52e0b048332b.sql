
-- Fix the foreign key constraint in personal_info table to reference auth table instead of users table
ALTER TABLE public.personal_info 
DROP CONSTRAINT IF EXISTS personal_info_user_id_fkey;

-- Add correct foreign key constraint to auth table
ALTER TABLE public.personal_info 
ADD CONSTRAINT personal_info_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

-- Also fix other resume tables that might have the same issue
ALTER TABLE public.education 
DROP CONSTRAINT IF EXISTS education_user_id_fkey;

ALTER TABLE public.education 
ADD CONSTRAINT education_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.work_experience 
DROP CONSTRAINT IF EXISTS work_experience_user_id_fkey;

ALTER TABLE public.work_experience 
ADD CONSTRAINT work_experience_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.resume_skills 
DROP CONSTRAINT IF EXISTS resume_skills_user_id_fkey;

ALTER TABLE public.resume_skills 
ADD CONSTRAINT resume_skills_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.positions_of_responsibility 
DROP CONSTRAINT IF EXISTS positions_of_responsibility_user_id_fkey;

ALTER TABLE public.positions_of_responsibility 
ADD CONSTRAINT positions_of_responsibility_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.achievements 
DROP CONSTRAINT IF EXISTS achievements_user_id_fkey;

ALTER TABLE public.achievements 
ADD CONSTRAINT achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.hobbies_activities 
DROP CONSTRAINT IF EXISTS hobbies_activities_user_id_fkey;

ALTER TABLE public.hobbies_activities 
ADD CONSTRAINT hobbies_activities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;

ALTER TABLE public.resume_summary 
DROP CONSTRAINT IF EXISTS resume_summary_user_id_fkey;

ALTER TABLE public.resume_summary 
ADD CONSTRAINT resume_summary_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.auth(id) ON DELETE CASCADE;
