
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

    const { 
      jobRole, 
      domain, 
      experienceLevel, 
      interviewType, 
      additionalConstraints,
      numQuestions = 5,
      userId 
    } = await req.json();

    console.log('Generating questions with config:', { jobRole, domain, experienceLevel, interviewType, userId });

    if (!jobRole || !domain || !experienceLevel || !interviewType) {
      throw new Error('Missing required fields');
    }

    // Fetch user's resume summary if userId is provided
    let resumeSummary = '';
    if (userId) {
      console.log('Fetching resume summary for user:', userId);
      const { data: summaryData, error: summaryError } = await supabaseClient
        .from('resume_summary')
        .select('summary_text')
        .eq('user_id', userId)
        .single();

      if (summaryError) {
        console.log('No resume summary found or error:', summaryError.message);
      } else if (summaryData?.summary_text) {
        resumeSummary = summaryData.summary_text;
        console.log('Resume summary found:', resumeSummary.substring(0, 100) + '...');
      }
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Enhanced prompt that includes resume summary for personalization
    const prompt = `
You are an expert interview question generator. Generate ${numQuestions} high-quality interview questions for the following position:

**Position Details:**
- Job Role: ${jobRole}
- Domain: ${domain}
- Experience Level: ${experienceLevel}
- Question Type: ${interviewType}
${additionalConstraints ? `- Additional Requirements: ${additionalConstraints}` : ''}

${resumeSummary ? `**Candidate's Background:**
Based on the candidate's resume summary: "${resumeSummary}"

Please tailor the questions to be relevant to their background, experience, and skills mentioned in their resume. Reference specific experiences, projects, or skills from their background when appropriate.` : ''}

**Instructions:**
1. Generate exactly ${numQuestions} questions
2. Questions should be appropriate for ${experienceLevel} level candidates
3. Focus on ${interviewType} type questions
4. Make questions progressively challenging
5. Include a mix of technical, behavioral, and scenario-based questions as appropriate
${resumeSummary ? '6. Personalize questions based on the candidate\'s resume summary provided above' : ''}
7. Each question should be detailed and specific
8. Avoid generic or overly simple questions

**Question Types to Include:**
- Technical knowledge and problem-solving
- Past experience and achievements
- Situational and behavioral scenarios
- Domain-specific expertise
- Leadership and teamwork (if applicable)

Return the response in the following JSON format:
{
  "questions": [
    {
      "question": "Detailed question text here",
      "type": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard",
      "focus_area": "specific skill or competency being tested"
    }
  ]
}

Ensure all questions are relevant, engaging, and help assess the candidate's suitability for the ${jobRole} position in ${domain}.
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
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response received');

    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      console.error('Invalid Gemini response structure:', geminiData);
      throw new Error('Invalid response from Gemini API');
    }

    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log('Generated content:', responseText.substring(0, 200) + '...');

    // Parse JSON response
    let questionsData;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      questionsData = JSON.parse(jsonMatch[0]);
      console.log('Parsed questions data:', questionsData);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', responseText);
      
      // Fallback: create structured questions from plain text
      const lines = responseText.split('\n').filter(line => 
        line.trim() && 
        (line.includes('?') || line.match(/^\d+[\.\)]/))
      );
      
      questionsData = {
        questions: lines.slice(0, numQuestions).map((line, index) => ({
          question: line.replace(/^\d+[\.\)\s]*/, '').trim(),
          type: 'general',
          difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
          focus_area: domain
        }))
      };
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error('Invalid questions format in API response');
    }

    // Ensure we have the requested number of questions
    const questions = questionsData.questions.slice(0, numQuestions);
    
    if (questions.length === 0) {
      throw new Error('No questions generated');
    }

    console.log(`Successfully generated ${questions.length} questions`);

    return new Response(
      JSON.stringify({ 
        questions: questions,
        resumePersonalized: !!resumeSummary,
        totalQuestions: questions.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate interview questions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
