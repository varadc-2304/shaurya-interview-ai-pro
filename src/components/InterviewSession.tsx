
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  StopCircle,
  Clock,
  MessageCircle,
  Brain
} from "lucide-react";
import { InterviewConfig } from "./InterviewSetup";

interface InterviewSessionProps {
  config: InterviewConfig;
  onEndInterview: (results: InterviewResults) => void;
}

export interface InterviewResults {
  questions: {
    question: string;
    userAnswer: string;
    aiEvaluation: string;
    score: number;
  }[];
  overallScore: number;
  feedback: string;
  duration: number;
}

const InterviewSession = ({ config, onEndInterview }: InterviewSessionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock questions for demonstration
  const mockQuestions = [
    "Tell me about yourself and why you're interested in this role.",
    "Describe a challenging project you worked on and how you overcame obstacles.",
    "How do you handle working under pressure and tight deadlines?",
    "What are your greatest strengths and how do they apply to this position?",
    "Where do you see yourself in 5 years?"
  ];

  const totalQuestions = mockQuestions.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setProgress((currentQuestion / totalQuestions) * 100);
  }, [currentQuestion, totalQuestions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Here you would integrate with speech-to-text API
    console.log("Starting to record user response...");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      handleNextQuestion();
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      // Simulate AI speaking the next question
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    } else {
      handleFinishInterview();
    }
  };

  const handleFinishInterview = () => {
    // Generate mock results
    const mockResults: InterviewResults = {
      questions: mockQuestions.map(q => ({
        question: q,
        userAnswer: "Mock user response...",
        aiEvaluation: "Good response with room for improvement in specific examples.",
        score: Math.floor(Math.random() * 30) + 70
      })),
      overallScore: 82,
      feedback: "Overall strong performance with good communication skills. Focus on providing more specific examples.",
      duration: duration
    };

    onEndInterview(mockResults);
  };

  const handlePlayQuestion = () => {
    setIsSpeaking(true);
    // Here you would integrate with text-to-speech API
    console.log("Playing question:", mockQuestions[currentQuestion]);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold shaurya-text-gradient">Interview in Progress</h1>
              <p className="text-muted-foreground">{config.jobRole} • {config.domain}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(duration)}</span>
              </div>
              <Badge variant="secondary">{config.questionType}</Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestion + 1} of {totalQuestions}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Main Interview Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span>Current Question</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-lg leading-relaxed text-gray-800">
                    {mockQuestions[currentQuestion]}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handlePlayQuestion}
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="h-4 w-4" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" />
                        <span>Replay Question</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Recording Controls */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Your Response</CardTitle>
                <CardDescription>Record your answer to the question</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    size="lg"
                    className={`w-20 h-20 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'shaurya-gradient hover:opacity-90'
                    } transition-all`}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {isProcessing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Brain className="h-4 w-4 animate-spin" />
                        <span>Processing your response...</span>
                      </span>
                    ) : isRecording ? (
                      "Recording... Click to stop"
                    ) : (
                      "Click to start recording"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleNextQuestion}
                  variant="outline"
                  className="w-full"
                  disabled={isRecording || isProcessing}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Next Question
                </Button>
                
                <Button
                  onClick={handleFinishInterview}
                  variant="destructive"
                  className="w-full"
                  disabled={isRecording || isProcessing}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
