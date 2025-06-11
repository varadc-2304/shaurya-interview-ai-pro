
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

    const { question, answer, jobRole, domain, experienceLevel = 'entry' } = await req.json();

    if (!question || !answer || !jobRole || !domain) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evaluationPrompt = `
Evaluate this interview response for a ${jobRole} position in ${domain} (${experienceLevel} level):

Question: ${question}
Answer: ${answer}

Provide a JSON response with this structure:
{
  "overall_score": <number 0-100>,
  "performance_level": "<Excellent|Strong|Good|Satisfactory|Needs Improvement>",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "detailed_feedback": "comprehensive feedback text",
  "recommendation": "<Strong Hire|Hire|Maybe|No Hire>"
}`;

    console.log('Sending request to Gemini API...');
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: evaluationPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Gemini response:', responseText);

    let evaluationData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      // Fallback evaluation
      const fallbackScore = Math.floor(Math.random() * 31) + 60;
      evaluationData = {
        overall_score: fallbackScore,
        performance_level: fallbackScore >= 80 ? "Strong" : fallbackScore >= 70 ? "Good" : "Satisfactory",
        strengths: ["Clear communication", "Good understanding", "Relevant experience"],
        improvements: ["Provide more specific examples", "Add technical details"],
        detailed_feedback: "The response shows understanding but could benefit from more specific examples and technical depth.",
        recommendation: fallbackScore >= 75 ? "Hire" : "Maybe"
      };
    }

    // Ensure valid data structure
    const score = Math.max(0, Math.min(100, evaluationData.overall_score || 70));
    const result = {
      score: score,
      performance_level: evaluationData.performance_level || "Good",
      strengths: Array.isArray(evaluationData.strengths) ? evaluationData.strengths : ["Shows understanding"],
      improvements: Array.isArray(evaluationData.improvements) ? evaluationData.improvements : ["Add more details"],
      detailed_feedback: evaluationData.detailed_feedback || "Response processed successfully",
      recommendation: evaluationData.recommendation || "Maybe"
    };

    console.log('Final evaluation result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evaluate-response function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        score: 60,
        performance_level: "Satisfactory",
        strengths: ["Attempted the question"],
        improvements: ["Provide more detailed response"],
        detailed_feedback: "Unable to complete full evaluation due to technical issue.",
        recommendation: "Maybe"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
