
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeData {
  personalInfo?: any;
  education?: any[];
  workExperience?: any[];
  skills?: any[];
  projects?: any[];
  positions?: any[];
  achievements?: any[];
  hobbies?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch all resume data
    const resumeData: ResumeData = {};

    // Fetch personal info
    const { data: personalInfo } = await supabaseClient
      .from('personal_info')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (personalInfo) resumeData.personalInfo = personalInfo;

    // Fetch education
    const { data: education } = await supabaseClient
      .from('education')
      .select('*')
      .eq('user_id', userId);
    
    if (education?.length) resumeData.education = education;

    // Fetch work experience
    const { data: workExperience } = await supabaseClient
      .from('work_experience')
      .select('*')
      .eq('user_id', userId);
    
    if (workExperience?.length) resumeData.workExperience = workExperience;

    // Fetch skills
    const { data: skills } = await supabaseClient
      .from('resume_skills')
      .select('*')
      .eq('user_id', userId);
    
    if (skills?.length) resumeData.skills = skills;

    // Fetch projects
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', userId);
    
    if (projects?.length) resumeData.projects = projects;

    // Fetch positions
    const { data: positions } = await supabaseClient
      .from('positions_of_responsibility')
      .select('*')
      .eq('user_id', userId);
    
    if (positions?.length) resumeData.positions = positions;

    // Fetch achievements
    const { data: achievements } = await supabaseClient
      .from('achievements')
      .select('*')
      .eq('user_id', userId);
    
    if (achievements?.length) resumeData.achievements = achievements;

    // Fetch hobbies
    const { data: hobbies } = await supabaseClient
      .from('hobbies_activities')
      .select('*')
      .eq('user_id', userId);
    
    if (hobbies?.length) resumeData.hobbies = hobbies;

    // Generate summary using Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
Based on the following resume data, generate a professional summary (2-3 sentences) that highlights the person's key strengths, experience, and career focus:

${JSON.stringify(resumeData, null, 2)}

Create a concise, compelling professional summary suitable for the top of a resume. Focus on the most relevant skills, experience, and achievements.
`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('Failed to generate summary from Gemini');
    }

    // Save or update the summary in the database
    const { error: upsertError } = await supabaseClient
      .from('resume_summary')
      .upsert({
        user_id: userId,
        summary_text: summary.trim()
      });

    if (upsertError) {
      throw upsertError;
    }

    return new Response(
      JSON.stringify({ summary: summary.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-resume-summary function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
