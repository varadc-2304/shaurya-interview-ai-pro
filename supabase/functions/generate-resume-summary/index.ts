
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('Generating resume summary for user:', userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch all resume data
    const [personalInfo, education, workExperience, skills, projects, achievements, positions, hobbies] = await Promise.all([
      supabaseClient.from('personal_info').select('*').eq('user_id', userId).single(),
      supabaseClient.from('education').select('*').eq('user_id', userId),
      supabaseClient.from('work_experience').select('*').eq('user_id', userId),
      supabaseClient.from('resume_skills').select('*').eq('user_id', userId),
      supabaseClient.from('projects').select('*').eq('user_id', userId),
      supabaseClient.from('achievements').select('*').eq('user_id', userId),
      supabaseClient.from('positions_of_responsibility').select('*').eq('user_id', userId),
      supabaseClient.from('hobbies_activities').select('*').eq('user_id', userId)
    ]);

    console.log('Fetched data:', {
      personalInfo: personalInfo.data,
      education: education.data?.length || 0,
      workExperience: workExperience.data?.length || 0,
      skills: skills.data?.length || 0,
      projects: projects.data?.length || 0,
      achievements: achievements.data?.length || 0,
      positions: positions.data?.length || 0,
      hobbies: hobbies.data?.length || 0
    });

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create a comprehensive resume data summary
    const resumeData = {
      personalInfo: personalInfo.data || {},
      education: education.data || [],
      workExperience: workExperience.data || [],
      skills: skills.data || [],
      projects: projects.data || [],
      achievements: achievements.data || [],
      positions: positions.data || [],
      hobbies: hobbies.data || []
    };

    // Generate AI summary prompt
    const prompt = `
Based on the following resume data, create a compelling 3-4 sentence professional summary that highlights the person's key strengths, experience, and career focus. Make it engaging and tailored to their background.

Personal Information: ${JSON.stringify(resumeData.personalInfo)}
Education: ${JSON.stringify(resumeData.education)}
Work Experience: ${JSON.stringify(resumeData.workExperience)}
Skills: ${JSON.stringify(resumeData.skills)}
Projects: ${JSON.stringify(resumeData.projects)}
Achievements: ${JSON.stringify(resumeData.achievements)}
Leadership Positions: ${JSON.stringify(resumeData.positions)}
Hobbies: ${JSON.stringify(resumeData.hobbies)}

Write a professional summary that:
1. Starts with their professional identity or field
2. Highlights 2-3 key technical skills or areas of expertise
3. Mentions relevant experience or education
4. Concludes with their career objective or what they bring to organizations

Keep it concise, professional, and impactful. Do not include any JSON formatting or extra text - just return the summary paragraph.
`;

    console.log('Sending request to Gemini API...');
    
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
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response received');

    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('Invalid Gemini response structure:', geminiData);
      throw new Error('Invalid response from Gemini API');
    }

    const summary = geminiData.candidates[0].content.parts[0].text.trim();
    console.log('Generated summary:', summary.substring(0, 100) + '...');

    // Save or update the summary in the database
    const { data: existingSummary } = await supabaseClient
      .from('resume_summary')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSummary) {
      // Update existing summary
      const { error: updateError } = await supabaseClient
        .from('resume_summary')
        .update({
          summary_text: summary,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating summary:', updateError);
        throw updateError;
      }
      console.log('Summary updated successfully');
    } else {
      // Insert new summary
      const { error: insertError } = await supabaseClient
        .from('resume_summary')
        .insert({
          user_id: userId,
          summary_text: summary
        });

      if (insertError) {
        console.error('Error inserting summary:', insertError);
        throw insertError;
      }
      console.log('Summary inserted successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summary 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-resume-summary function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate resume summary'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
