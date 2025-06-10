
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

    console.log('Fetching audio from URL...');
    
    // Fetch the audio file from the URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error('Failed to fetch audio:', audioResponse.status, audioResponse.statusText);
      throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log('Audio buffer size:', audioBuffer.byteLength);

    // Create form data for ElevenLabs API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model_id', 'eleven_multilingual_v2');

    console.log('Sending request to ElevenLabs speech-to-text API...');

    // Send to ElevenLabs speech-to-text API
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    console.log('ElevenLabs response status:', elevenLabsResponse.status);

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error response:', errorText);
      throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
    }

    const result = await elevenLabsResponse.json();
    console.log('ElevenLabs successful response:', result);

    // ElevenLabs returns the transcription in the 'text' field
    const transcribedText = result.text || '';
    console.log('Final transcribed text:', transcribedText);

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
