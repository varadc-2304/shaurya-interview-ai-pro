
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import InterviewSetup, { InterviewConfig } from "@/components/InterviewSetup";
import InterviewSession from "@/components/InterviewSession";
import InterviewResults from "@/components/InterviewResults";
import Resume from "@/pages/Resume";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AppState = 'setup' | 'interview' | 'results' | 'resume';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('setup');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for auto-login user data
    const autoLoginUser = sessionStorage.getItem('auto_login_user');
    if (autoLoginUser) {
      try {
        const userData = JSON.parse(autoLoginUser);
        setUser(userData);
        setIsAuthenticated(true);
        setCurrentState('setup');
        
        // Clear the auto-login data
        sessionStorage.removeItem('auto_login_user');
        
        toast({
          title: "Welcome back!",
          description: `You have been automatically logged in.`
        });
      } catch (error) {
        console.error('Error processing auto-login:', error);
        sessionStorage.removeItem('auto_login_user');
        // Redirect to external site if auto-login fails
        window.location.href = 'https://ikshvaku-innovations.in';
        return;
      }
    } else {
      // No auto-login data found, redirect to external site
      window.location.href = 'https://ikshvaku-innovations.in';
      return;
    }
    
    setIsCheckingAuth(false);
  }, [toast]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentState('setup');
    setInterviewConfig(null);
    setInterviewId(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to external site after logout
    window.location.href = 'https://ikshvaku-innovations.in';
  };

  const handleStartInterview = async (config: InterviewConfig) => {
    try {
      if (!user) return;

      // Fetch resume summary to include in interview context
      let resumeContext = '';
      const { data: resumeSummary } = await supabase
        .from('resume_summary')
        .select('summary_text')
        .eq('user_id', user.id)
        .single();

      if (resumeSummary?.summary_text) {
        resumeContext = `\n\nCandidate Resume Summary: ${resumeSummary.summary_text}`;
      }

      // Create interview record in database
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          user_id: user.id,
          job_role: config.jobRole,
          domain: config.domain,
          experience: config.experienceLevel,
          question_type: config.questionType,
          additional_constraints: config.additionalConstraints + resumeContext,
          status: 'in_progress'
        })
        .select()
        .single();

      if (interviewError) {
        throw interviewError;
      }

      setInterviewId(interview.id);
      setInterviewConfig(config);
      setCurrentState('interview');
      
      toast({
        title: "Interview Starting",
        description: "Your AI mock interview is beginning. Good luck!",
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEndInterview = () => {
    setCurrentState('results');
    toast({
      title: "Interview Complete!",
      description: "Your interview has been completed and analyzed.",
    });
  };

  const handleStartNewInterview = () => {
    setCurrentState('setup');
    setInterviewConfig(null);
    setInterviewId(null);
  };

  const handleNavigateToResume = () => {
    setCurrentState('resume');
  };

  const handleNavigateToHome = () => {
    setCurrentState('setup');
  };

  const handleBackFromResume = () => {
    setCurrentState('setup');
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this component shouldn't render as user will be redirected
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Only show Header when NOT in interview state */}
      {currentState !== 'interview' && (
        <Header 
          isAuthenticated={isAuthenticated}
          onLogin={() => {}} // No login functionality
          onLogout={handleLogout}
          onNavigateToResume={handleNavigateToResume}
          onNavigateToHome={handleNavigateToHome}
        />
      )}
      
      {currentState === 'setup' && (
        <InterviewSetup onStartInterview={handleStartInterview} />
      )}
      
      {currentState === 'interview' && interviewConfig && interviewId && user && (
        <InterviewSession 
          config={interviewConfig}
          interviewId={interviewId}
          userId={user.id}
          onEndInterview={handleEndInterview}
        />
      )}
      
      {currentState === 'results' && interviewId && (
        <InterviewResults 
          interviewId={interviewId}
          onStartNewInterview={handleStartNewInterview}
        />
      )}

      {currentState === 'resume' && user && (
        <Resume 
          onBack={handleBackFromResume}
          user={user}
        />
      )}
    </div>
  );
};

export default Index;
