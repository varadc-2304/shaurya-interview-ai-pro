
import { useState } from "react";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import InterviewSetup, { InterviewConfig } from "@/components/InterviewSetup";
import InterviewSession from "@/components/InterviewSession";
import InterviewResults from "@/components/InterviewResults";
import Resume from "@/pages/Resume";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AppState = 'login' | 'setup' | 'interview' | 'results' | 'resume';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLogin = async (email: string, password: string) => {
    try {
      // Query the auth table for user credentials
      const { data: authData, error: authError } = await supabase
        .from('auth')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (authError || !authData) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive"
        });
        return;
      }

      setUser({
        id: authData.id,
        email: authData.email,
        name: authData.name || authData.email.split('@')[0],
        role: authData.role
      });
      setIsAuthenticated(true);
      setCurrentState('setup');
      
      toast({
        title: "Welcome to Shaurya!",
        description: "You have successfully logged in.",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentState('login');
    setInterviewConfig(null);
    setInterviewId(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
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

  const handleBackFromResume = () => {
    setCurrentState('setup');
  };

  if (currentState === 'login') {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated={isAuthenticated}
        onLogin={() => setCurrentState('login')}
        onLogout={handleLogout}
        onNavigateToResume={handleNavigateToResume}
      />
      
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
