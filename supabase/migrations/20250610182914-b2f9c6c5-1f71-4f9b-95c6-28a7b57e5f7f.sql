
-- Add unique constraint on user_id for personal_info table
ALTER TABLE public.personal_info ADD CONSTRAINT personal_info_user_id_unique UNIQUE (user_id);

-- Add unique constraint on user_id for other resume tables that might need upsert functionality
ALTER TABLE public.resume_skills ADD CONSTRAINT resume_skills_user_id_skill_name_unique UNIQUE (user_id, skill_name);
ALTER TABLE public.hobbies_activities ADD CONSTRAINT hobbies_activities_user_id_activity_name_unique UNIQUE (user_id, activity_name);
