
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse the request body
    const { user_id } = await req.json();

    if (!user_id) {
      console.log('Missing user_id in request');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Attempting auto-login for user_id:', user_id);

    // Validate user exists in auth table
    const { data: authUser, error: authError } = await supabase
      .from('auth')
      .select('id, email, name')
      .eq('id', user_id)
      .single();

    if (authError || !authUser) {
      console.log('User validation failed:', authError?.message || 'User not found');
      return new Response(
        JSON.stringify({ error: 'Invalid user_id' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('User validated successfully:', authUser.email);

    // Generate a unique token
    const token = crypto.randomUUID();

    // Create auto-login token (expires in 5 minutes by default as per table constraint)
    const { data: tokenData, error: tokenError } = await supabase
      .from('auto_login_tokens')
      .insert({
        user_id: user_id,
        token: token
      })
      .select()
      .single();

    if (tokenError) {
      console.log('Token creation failed:', tokenError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create auto-login token' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Auto-login token created successfully');

    // Get the current site URL from environment or construct it
    const siteUrl = Deno.env.get('SITE_URL') || 'https://tafvjwurzgpugcfidbfv.supabase.co';
    const loginUrl = `${siteUrl}/auto-login?token=${token}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        login_url: loginUrl,
        token: token,
        expires_at: tokenData.expires_at,
        message: 'Auto-login token created successfully'
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Auto-login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
