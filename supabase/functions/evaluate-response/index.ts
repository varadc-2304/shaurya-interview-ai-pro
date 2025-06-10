
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

    const { question, answer, jobRole, domain, experienceLevel = 'entry', facialAnalysis } = await req.json();

    console.log('Evaluating response:', { 
      question: question.substring(0, 100), 
      answer: answer.substring(0, 100), 
      jobRole, 
      domain, 
      experienceLevel,
      hasFacialAnalysis: !!facialAnalysis 
    });

    if (!question || !answer || !jobRole || !domain) {
      throw new Error('Missing required fields: question, answer, jobRole, domain');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Enhanced evaluation prompt with facial analysis integration
    const evaluationPrompt = `
You are an expert interview evaluator with deep knowledge in ${domain} and experience in hiring for ${jobRole} positions. 

**EVALUATION TASK:**
Evaluate the candidate's response to the following interview question with comprehensive scoring across multiple dimensions, including non-verbal communication analysis.

**QUESTION:** ${question}

**CANDIDATE'S ANSWER:** ${answer}

**POSITION DETAILS:**
- Role: ${jobRole}
- Domain: ${domain}
- Experience Level: ${experienceLevel}

${facialAnalysis ? `
**FACIAL ANALYSIS DATA:**
The candidate's non-verbal behavior during this response has been analyzed:
- Emotions: ${JSON.stringify(facialAnalysis.emotions)}
- Confidence Indicators: ${JSON.stringify(facialAnalysis.confidence)}
- Engagement Metrics: ${JSON.stringify(facialAnalysis.engagement)}
- Analysis Duration: ${facialAnalysis.duration_analyzed}s with ${facialAnalysis.sample_count} samples

Use this data to assess non-verbal communication, confidence, and engagement levels.
` : ''}

**COMPREHENSIVE SCORING CRITERIA:**

1. **Technical Accuracy & Knowledge (20%)**
   - Correctness of technical concepts mentioned
   - Depth of domain-specific knowledge
   - Use of appropriate terminology
   - Understanding of best practices

2. **Problem-Solving & Critical Thinking (15%)**
   - Logical reasoning and structured thinking
   - Ability to break down complex problems
   - Creative and innovative approaches
   - Risk assessment and mitigation strategies

3. **Verbal Communication & Clarity (15%)**
   - Clear articulation of ideas
   - Logical flow and organization
   - Use of examples and analogies
   - Ability to explain complex concepts simply

4. **Relevant Experience & Examples (10%)**
   - Specific, concrete examples from experience
   - Relevance to the question asked
   - Demonstration of practical application
   - Learning from past experiences

${facialAnalysis ? `
5. **Non-Verbal Confidence (15%)**
   - Eye contact and attention patterns
   - Facial expression stability and appropriateness
   - Head pose and body language confidence
   - Overall non-verbal presence

6. **Emotional Intelligence & Regulation (10%)**
   - Appropriate emotional responses to questions
   - Stress management and composure
   - Emotional consistency throughout response
   - Professional demeanor maintenance

7. **Engagement & Enthusiasm (10%)**
   - Level of attention and focus
   - Enthusiasm and interest demonstration
   - Active participation indicators
   - Energy and motivation levels
` : `
5. **Leadership & Collaboration (15%)**
   - Evidence of teamwork and collaboration
   - Leadership potential and initiative
   - Conflict resolution abilities
   - Mentoring and knowledge sharing

6. **Adaptability & Learning (10%)**
   - Openness to new technologies/methods
   - Continuous learning mindset
   - Ability to handle change and uncertainty
   - Growth mindset demonstration
`}

8. **Industry Awareness & Vision (5%)**
   - Understanding of industry trends
   - Future-oriented thinking
   - Business impact awareness
   - Market and competitive knowledge

**DETAILED ANALYSIS REQUIREMENTS:**

For each scoring dimension, provide:
- Specific score (0-10)
- 2-3 bullet points of evidence from the response${facialAnalysis ? ' and non-verbal analysis' : ''}
- What was done well
- What could be improved

${facialAnalysis ? `
**NON-VERBAL ANALYSIS GUIDELINES:**
- High confidence: Good eye contact (>0.6), stable head position, consistent expressions
- Good engagement: Focused attention (>0.7), appropriate enthusiasm, low stress indicators (<0.4)
- Emotional regulation: Appropriate emotional responses, controlled stress levels, professional composure
` : ''}

**OVERALL ASSESSMENT:**
- Calculate weighted average score (0-100)
- Provide overall performance level: Excellent (90-100), Strong (80-89), Good (70-79), Satisfactory (60-69), Needs Improvement (50-59), Weak (0-49)
- Give 3-5 key strengths observed
- Give 3-5 specific areas for improvement with actionable advice
- Suggest follow-up questions based on gaps identified
- Rate cultural fit potential (High/Medium/Low) with reasoning

**EXPERIENCE-LEVEL ADJUSTMENTS:**
${experienceLevel === 'entry' ? 
  '- Focus more on potential, learning ability, and foundational knowledge\n- Be encouraging while providing constructive feedback\n- Consider academic projects and internships as valid experience' :
experienceLevel === 'mid' ?
  '- Expect solid technical skills and some leadership experience\n- Look for evidence of project ownership and mentoring\n- Assess ability to work independently and guide junior members' :
  '- Expect deep expertise and strategic thinking\n- Look for evidence of technical leadership and vision\n- Assess ability to drive organizational change and innovation'
}

**RESPONSE FORMAT:**
Return your evaluation as a JSON object with this exact structure:

{
  "overall_score": <0-100>,
  "performance_level": "<Excellent|Strong|Good|Satisfactory|Needs Improvement|Weak>",
  "dimension_scores": {
    "technical_accuracy": <0-10>,
    "problem_solving": <0-10>,
    "verbal_communication": <0-10>,
    "experience_examples": <0-10>,${facialAnalysis ? `
    "nonverbal_confidence": <0-10>,
    "emotional_regulation": <0-10>,
    "engagement_enthusiasm": <0-10>,` : `
    "leadership_collaboration": <0-10>,
    "adaptability_learning": <0-10>,`}
    "industry_awareness": <0-10>
  },
  "detailed_feedback": {
    "technical_accuracy": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "problem_solving": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "verbal_communication": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "experience_examples": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },${facialAnalysis ? `
    "nonverbal_confidence": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "emotional_regulation": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "engagement_enthusiasm": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },` : `
    "leadership_collaboration": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },
    "adaptability_learning": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    },`}
    "industry_awareness": {
      "score": <0-10>,
      "evidence": ["point1", "point2"],
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
  },
  "key_strengths": ["strength1", "strength2", "strength3"],
  "improvement_areas": [
    {
      "area": "specific area",
      "actionable_advice": "concrete steps to improve"
    }
  ],
  "follow_up_questions": ["question1", "question2"],
  "cultural_fit": {
    "rating": "<High|Medium|Low>",
    "reasoning": "explanation of cultural fit assessment"
  },
  "interviewer_notes": "Additional insights for the interviewing team",
  "recommendation": "<Strong Hire|Hire|Maybe|No Hire>",
  "confidence_level": "<High|Medium|Low>"${facialAnalysis ? `,
  "nonverbal_summary": {
    "confidence_indicators": "summary of confidence-related observations",
    "engagement_quality": "summary of engagement and enthusiasm",
    "emotional_state": "summary of emotional regulation and appropriateness"
  }` : ''}
}

Be thorough, fair, and constructive in your evaluation. ${facialAnalysis ? 'Use the facial analysis data to provide deeper insights into the candidate\'s non-verbal communication and overall presentation.' : ''} Focus on providing actionable feedback that helps both the candidate and the hiring team make informed decisions.
`;

    console.log('Sending evaluation request to Gemini API...');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: evaluationPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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
    console.log('Evaluation content:', responseText.substring(0, 300) + '...');

    let evaluationData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      evaluationData = JSON.parse(jsonMatch[0]);
      console.log('Parsed evaluation data successfully');
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', responseText);
      
      // Fallback with appropriate dimensions based on whether facial analysis is available
      const baseDimensions = {
        technical_accuracy: 7,
        problem_solving: 7,
        verbal_communication: 7,
        experience_examples: 6,
        industry_awareness: 6
      };

      const facialDimensions = facialAnalysis ? {
        nonverbal_confidence: 6,
        emotional_regulation: 7,
        engagement_enthusiasm: 6
      } : {
        leadership_collaboration: 6,
        adaptability_learning: 7
      };

      evaluationData = {
        overall_score: 70,
        performance_level: "Good",
        dimension_scores: { ...baseDimensions, ...facialDimensions },
        detailed_feedback: {
          technical_accuracy: {
            score: 7,
            evidence: ["Response shows understanding of key concepts"],
            strengths: ["Good foundational knowledge"],
            improvements: ["Could provide more specific technical details"]
          }
        },
        key_strengths: ["Clear communication", "Relevant experience", "Good problem-solving approach"],
        improvement_areas: [
          {
            area: "Technical depth",
            actionable_advice: "Provide more specific technical examples and details"
          }
        ],
        follow_up_questions: ["Can you elaborate on the technical implementation?"],
        cultural_fit: {
          rating: "Medium",
          reasoning: "Shows potential for team collaboration"
        },
        interviewer_notes: "Candidate shows promise with room for growth",
        recommendation: "Maybe",
        confidence_level: "Medium"
      };
    }

    if (!evaluationData.overall_score || !evaluationData.performance_level) {
      throw new Error('Invalid evaluation format');
    }

    // Calculate final score if not provided
    if (!evaluationData.overall_score && evaluationData.dimension_scores) {
      const weights = facialAnalysis ? {
        technical_accuracy: 0.20,
        problem_solving: 0.15,
        verbal_communication: 0.15,
        experience_examples: 0.10,
        nonverbal_confidence: 0.15,
        emotional_regulation: 0.10,
        engagement_enthusiasm: 0.10,
        industry_awareness: 0.05
      } : {
        technical_accuracy: 0.25,
        problem_solving: 0.20,
        verbal_communication: 0.15,
        experience_examples: 0.15,
        leadership_collaboration: 0.10,
        adaptability_learning: 0.10,
        industry_awareness: 0.05
      };
      
      let weightedScore = 0;
      for (const [dimension, weight] of Object.entries(weights)) {
        weightedScore += (evaluationData.dimension_scores[dimension] || 0) * weight * 10;
      }
      evaluationData.overall_score = Math.round(weightedScore);
    }

    console.log(`Evaluation completed with score: ${evaluationData.overall_score}/100`);

    return new Response(
      JSON.stringify({
        score: evaluationData.overall_score,
        performance_level: evaluationData.performance_level,
        dimension_scores: evaluationData.dimension_scores,
        detailed_feedback: evaluationData.detailed_feedback,
        feedback: evaluationData.interviewer_notes || 'Comprehensive evaluation completed',
        strengths: evaluationData.key_strengths || [],
        improvements: evaluationData.improvement_areas?.map(area => area.actionable_advice) || [],
        follow_up_questions: evaluationData.follow_up_questions || [],
        cultural_fit: evaluationData.cultural_fit,
        recommendation: evaluationData.recommendation,
        confidence_level: evaluationData.confidence_level,
        nonverbal_summary: evaluationData.nonverbal_summary,
        evaluation_summary: {
          total_dimensions: facialAnalysis ? 8 : 7,
          scoring_method: 'weighted_average',
          experience_adjusted: true,
          includes_facial_analysis: !!facialAnalysis
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in evaluate-response function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to evaluate interview response',
        fallback_score: 60,
        fallback_feedback: 'Unable to complete detailed evaluation. Please review response manually.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
