
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioUrl, fileName } = await req.json();
    
    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    console.log('Processing audio from URL:', audioUrl);
    console.log('File name:', fileName);

    const elevenLabsApiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Download the audio file from Supabase storage
    console.log('Downloading audio file from Supabase storage...');
    const audioResponse = await fetch(audioUrl);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.status}`);
    }

    const audioArrayBuffer = await audioResponse.arrayBuffer();
    console.log('Downloaded audio size:', audioArrayBuffer.byteLength, 'bytes');

    // Create form data for ElevenLabs API
    const formData = new FormData();
    const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/webm' });
    formData.append('audio', audioBlob, fileName || 'audio.webm');
    formData.append('model_id', 'eleven_multilingual_v2');

    console.log('Calling ElevenLabs Speech-to-Text API...');

    // Call ElevenLabs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('ElevenLabs response:', result);

    return new Response(
      JSON.stringify({ text: result.text || '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in speech-to-text function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
