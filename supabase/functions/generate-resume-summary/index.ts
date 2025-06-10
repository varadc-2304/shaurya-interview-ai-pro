
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Generate resume summary function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    console.log('Processing resume summary for user:', userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all resume data for the user
    console.log('Fetching resume data...');

    const [personalInfo, education, workExperience, skills, projects, positions, achievements, hobbies] = await Promise.all([
      supabase.from('personal_info').select('*').eq('user_id', userId).single(),
      supabase.from('education').select('*').eq('user_id', userId),
      supabase.from('work_experience').select('*').eq('user_id', userId),
      supabase.from('resume_skills').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('positions_of_responsibility').select('*').eq('user_id', userId),
      supabase.from('achievements').select('*').eq('user_id', userId),
      supabase.from('hobbies_activities').select('*').eq('user_id', userId)
    ]);

    // Build resume text for AI processing
    let resumeText = "Resume Summary:\n\n";

    if (personalInfo.data) {
      resumeText += `Personal Information:\n`;
      resumeText += `Name: ${personalInfo.data.full_name || 'Not provided'}\n`;
      resumeText += `Email: ${personalInfo.data.email || 'Not provided'}\n`;
      resumeText += `Phone: ${personalInfo.data.phone || 'Not provided'}\n`;
      if (personalInfo.data.linkedin_url) resumeText += `LinkedIn: ${personalInfo.data.linkedin_url}\n`;
      if (personalInfo.data.github_url) resumeText += `GitHub: ${personalInfo.data.github_url}\n`;
      resumeText += `\n`;
    }

    if (education.data && education.data.length > 0) {
      resumeText += `Education:\n`;
      education.data.forEach(edu => {
        resumeText += `- ${edu.degree} in ${edu.field_of_study} from ${edu.institution_name}`;
        if (edu.gpa) resumeText += ` (GPA: ${edu.gpa})`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (workExperience.data && workExperience.data.length > 0) {
      resumeText += `Work Experience:\n`;
      workExperience.data.forEach(work => {
        resumeText += `- ${work.position} at ${work.company_name}`;
        if (work.is_current) resumeText += ` (Current)`;
        if (work.description) resumeText += `\n  ${work.description}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (skills.data && skills.data.length > 0) {
      resumeText += `Skills:\n`;
      const skillsByCategory = skills.data.reduce((acc, skill) => {
        const category = skill.skill_category || 'General';
        if (!acc[category]) acc[category] = [];
        acc[category].push(`${skill.skill_name} (${skill.proficiency_level || 'Not specified'})`);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(skillsByCategory).forEach(([category, skillList]) => {
        resumeText += `- ${category}: ${skillList.join(', ')}\n`;
      });
      resumeText += `\n`;
    }

    if (projects.data && projects.data.length > 0) {
      resumeText += `Projects:\n`;
      projects.data.forEach(project => {
        resumeText += `- ${project.project_name}`;
        if (project.description) resumeText += `: ${project.description}`;
        if (project.technologies_used) resumeText += `\n  Technologies: ${project.technologies_used.join(', ')}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (positions.data && positions.data.length > 0) {
      resumeText += `Positions of Responsibility:\n`;
      positions.data.forEach(pos => {
        resumeText += `- ${pos.position_title} at ${pos.organization}`;
        if (pos.description) resumeText += `\n  ${pos.description}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (achievements.data && achievements.data.length > 0) {
      resumeText += `Achievements:\n`;
      achievements.data.forEach(achievement => {
        resumeText += `- ${achievement.achievement_title}`;
        if (achievement.issuing_organization) resumeText += ` (${achievement.issuing_organization})`;
        if (achievement.description) resumeText += `\n  ${achievement.description}`;
        resumeText += `\n`;
      });
      resumeText += `\n`;
    }

    if (hobbies.data && hobbies.data.length > 0) {
      resumeText += `Hobbies & Activities:\n`;
      hobbies.data.forEach(hobby => {
        resumeText += `- ${hobby.activity_name}`;
        if (hobby.description) resumeText += `: ${hobby.description}`;
        resumeText += `\n`;
      });
    }

    console.log('Resume text compiled, sending to Gemini...');

    // Call Gemini API to generate summary
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please generate a concise professional summary (2-3 paragraphs) of the following resume data. Focus on key strengths, skills, experience, and potential. Make it suitable for interview preparation:\n\n${resumeText}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates[0]?.content?.parts[0]?.text || 'Unable to generate summary';

    console.log('Summary generated:', summary);

    // Store the summary in the database
    const { error: upsertError } = await supabase
      .from('resume_summary')
      .upsert({
        user_id: userId,
        summary_text: summary,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error storing summary:', upsertError);
      throw upsertError;
    }

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-resume-summary function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
