
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAutoLogin = async () => {
      const token = searchParams.get('token');

      if (!token) {
        toast({
          title: "Invalid Link",
          description: "No authentication token provided.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        // First, validate the token
        const { data: tokenData, error: tokenError } = await supabase
          .from('auto_login_tokens')
          .select('user_id, expires_at, used')
          .eq('token', token)
          .eq('used', false)
          .single();

        if (tokenError || !tokenData) {
          toast({
            title: "Invalid Token",
            description: "The authentication token is invalid or has expired.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Check if token has expired
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        
        if (now > expiresAt) {
          toast({
            title: "Token Expired",
            description: "The authentication token has expired.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Get user details from auth table
        const { data: userData, error: userError } = await supabase
          .from('auth')
          .select('id, email, name, role')
          .eq('id', tokenData.user_id)
          .single();

        if (userError || !userData) {
          toast({
            title: "User Not Found",
            description: "The user associated with this token was not found.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        // Mark token as used
        await supabase
          .from('auto_login_tokens')
          .update({ used: true })
          .eq('token', token);

        // Set up the user session in the parent app
        const userSessionData = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role
        };

        // Store user data in sessionStorage for the main app to pick up
        sessionStorage.setItem('auto_login_user', JSON.stringify(userSessionData));

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userSessionData.name}!`
        });

        // Redirect to home page
        navigate('/', { replace: true });

      } catch (error) {
        console.error('Auto-login error:', error);
        toast({
          title: "Login Failed",
          description: "An error occurred during automatic login.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setIsProcessing(false);
      }
    };

    processAutoLogin();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
        <h2 className="text-2xl font-semibold text-slate-800">
          {isProcessing ? "Logging you in..." : "Redirecting..."}
        </h2>
        <p className="text-slate-600">
          Please wait while we authenticate your session.
        </p>
      </div>
    </div>
  );
};

export default AutoLogin;
