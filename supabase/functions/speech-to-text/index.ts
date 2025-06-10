
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Speech-to-text function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();
    console.log('Received audioUrl:', audioUrl);

    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Sending request to ElevenLabs API with cloud_storage_url...');

    // Send to ElevenLabs speech-to-text API using cloud_storage_url parameter
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'whisper-1',
        cloud_storage_url: audioUrl
      }),
    });

    console.log('ElevenLabs response status:', elevenLabsResponse.status);

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
    }

    const result = await elevenLabsResponse.json();
    console.log('ElevenLabs response:', result);

    // ElevenLabs returns the transcription in the 'text' field
    const transcribedText = result.text || '';
    console.log('Transcribed text:', transcribedText);

    return new Response(
      JSON.stringify({ text: transcribedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in speech-to-text function:', error);
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
