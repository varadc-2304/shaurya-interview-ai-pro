
import { useState } from "react";
import Header from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import InterviewSetup, { InterviewConfig } from "@/components/InterviewSetup";
import InterviewSession from "@/components/InterviewSession";
import InterviewResults, { InterviewResults as IInterviewResults } from "@/components/InterviewResults";
import { useToast } from "@/hooks/use-toast";

type AppState = 'login' | 'signup' | 'setup' | 'interview' | 'results';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [interviewResults, setInterviewResults] = useState<IInterviewResults | null>(null);
  const { toast } = useToast();

  const handleLogin = (email: string, password: string) => {
    // Mock authentication
    console.log("Login attempt:", { email, password });
    setIsAuthenticated(true);
    setCurrentState('setup');
    toast({
      title: "Welcome to Shaurya!",
      description: "You have successfully logged in.",
    });
  };

  const handleSignup = (name: string, email: string, password: string) => {
    // Mock signup
    console.log("Signup attempt:", { name, email, password });
    setIsAuthenticated(true);
    setCurrentState('setup');
    toast({
      title: "Account Created!",
      description: "Welcome to Shaurya. Let's set up your first interview.",
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentState('login');
    setInterviewConfig(null);
    setInterviewResults(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleStartInterview = (config: InterviewConfig) => {
    setInterviewConfig(config);
    setCurrentState('interview');
    toast({
      title: "Interview Starting",
      description: "Your AI mock interview is beginning. Good luck!",
    });
  };

  const handleEndInterview = (results: IInterviewResults) => {
    setInterviewResults(results);
    setCurrentState('results');
    toast({
      title: "Interview Complete!",
      description: "Your interview has been completed and analyzed.",
    });
  };

  const handleStartNewInterview = () => {
    setCurrentState('setup');
    setInterviewConfig(null);
    setInterviewResults(null);
  };

  if (currentState === 'login') {
    return <LoginForm onLogin={handleLogin} onSwitchToSignup={() => setCurrentState('signup')} />;
  }

  if (currentState === 'signup') {
    return <SignupForm onSignup={handleSignup} onSwitchToLogin={() => setCurrentState('login')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated={isAuthenticated}
        onLogin={() => setCurrentState('login')}
        onLogout={handleLogout}
      />
      
      {currentState === 'setup' && (
        <InterviewSetup onStartInterview={handleStartInterview} />
      )}
      
      {currentState === 'interview' && interviewConfig && (
        <InterviewSession 
          config={interviewConfig}
          onEndInterview={handleEndInterview}
        />
      )}
      
      {currentState === 'results' && interviewResults && (
        <InterviewResults 
          results={interviewResults}
          onStartNewInterview={handleStartNewInterview}
        />
      )}
    </div>
  );
};

export default Index;
