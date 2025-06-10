
import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ResponseComposer from './ResponseComposer';

interface InterviewSessionProps {
  config: InterviewConfig;
  interviewId: string;
  userId: string;
  onEndInterview: () => void;
}

interface Question {
  id: string;
  text: string;
  number: number;
}

const InterviewSession = ({ config, interviewId, userId, onEndInterview }: InterviewSessionProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalQuestions = 5;

  useEffect(() => {
    generateQuestions();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setProgress((currentQuestionIndex / totalQuestions) * 100);
  }, [currentQuestionIndex, totalQuestions]);

  const generateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true);
      console.log("Generating questions with config:", config);
      
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          jobRole: config.jobRole,
          domain: config.domain,
          experienceLevel: config.experienceLevel,
          interviewType: config.questionType,
          additionalConstraints: config.additionalConstraints,
          numQuestions: totalQuestions
        }
      });

      console.log("Generate questions response:", data, error);

      if (error) throw error;

      if (data?.questions) {
        const questionList = data.questions.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          text: q.question,
          number: index + 1
        }));
        
        setQuestions(questionList);
        
        // Store questions in database
        for (const question of questionList) {
          await supabase.from('interview_questions').insert({
            interview_id: interviewId,
            question_number: question.number,
            question_text: question.text
          });
        }
        
        // Read out first question
        if (questionList.length > 0) {
          await playQuestion(questionList[0].text);
        }
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const playQuestion = async (questionText: string) => {
    try {
      setIsSpeaking(true);
      console.log('Playing question:', questionText);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: questionText,
          voice: 'alloy'
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing question:', error);
      setIsSpeaking(false);
      toast({
        title: "Audio Error",
        description: "Failed to play question audio.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnhancedResponse = async (response: {
    audioBlob: Blob | null;
    textContent: string;
    codeContent: string;
    codeLanguage: string;
  }) => {
    try {
      setIsProcessing(true);
      console.log('Processing enhanced response:', response);
      
      let transcribedText = '';
      
      // Process audio if provided
      if (response.audioBlob) {
        console.log('Processing audio, size:', response.audioBlob.size);
        
        // Create unique filename
        const fileName = `interview_${interviewId}_q${currentQuestionIndex + 1}_${Date.now()}.webm`;
        console.log('Uploading to storage with filename:', fileName);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(fileName, response.audioBlob, {
            contentType: 'audio/webm'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(fileName);

        console.log('Public URL obtained:', publicUrl);

        // Send URL to speech-to-text function
        console.log('Sending to speech-to-text function...');
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
          body: { audioUrl: publicUrl }
        });

        if (transcriptionError) {
          console.error('Speech-to-text error:', transcriptionError);
          throw transcriptionError;
        }

        console.log('Transcription result:', transcriptionData);
        transcribedText = transcriptionData?.text || '';

        // Clean up the uploaded file after processing
        await supabase.storage
          .from('audio_files')
          .remove([fileName]);
      }

      // Combine all response components
      const combinedResponse = [
        transcribedText && `Speech: ${transcribedText}`,
        response.textContent && `Text: ${response.textContent}`,
        response.codeContent && `Code (${response.codeLanguage}): ${response.codeContent}`
      ].filter(Boolean).join('\n\n');

      if (!combinedResponse.trim()) {
        toast({
          title: "No Response Detected",
          description: "Please provide at least one type of response.",
          variant: "destructive"
        });
        return;
      }

      console.log('Combined response:', combinedResponse);

      // Evaluate combined response
      const currentQuestion = questions[currentQuestionIndex];
      await evaluateResponse(currentQuestion, combinedResponse);
      
      // Update interview question with all response components
      await supabase
        .from('interview_questions')
        .update({
          user_response: transcribedText,
          user_text_response: response.textContent,
          user_code_response: response.codeContent,
          response_language: response.codeContent ? response.codeLanguage : null
        })
        .eq('interview_id', interviewId)
        .eq('question_number', currentQuestionIndex + 1);

      toast({
        title: "Response Submitted",
        description: "Your comprehensive answer has been processed successfully.",
      });

    } catch (error) {
      console.error('Error processing enhanced response:', error);
      toast({
        title: "Processing Error",
        description: `Failed to process your response: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const evaluateResponse = async (question: Question, userResponse: string) => {
    try {
      console.log('Evaluating response for question:', question.text);
      console.log('User response:', userResponse);
      
      const { data, error } = await supabase.functions.invoke('evaluate-response', {
        body: {
          question: question.text,
          answer: userResponse,
          jobRole: config.jobRole,
          domain: config.domain
        }
      });

      if (error) throw error;

      console.log('Evaluation result:', data);

      // Update database with evaluation
      await supabase
        .from('interview_questions')
        .update({
          evaluation_score: data?.score || 0,
          evaluation_feedback: data?.feedback || '',
          strengths: data?.strengths || [],
          improvements: data?.improvements || []
        })
        .eq('interview_id', interviewId)
        .eq('question_number', question.number);

    } catch (error) {
      console.error('Error evaluating response:', error);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      await playQuestion(questions[nextIndex].text);
    } else {
      await handleFinishInterview();
    }
  };

  const handleFinishInterview = async () => {
    try {
      console.log('Finishing interview...');
      
      // Update interview status
      await supabase
        .from('interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', interviewId);

      onEndInterview();
    } catch (error) {
      console.error('Error finishing interview:', error);
    }
  };

  const handleReplayQuestion = () => {
    if (questions[currentQuestionIndex]) {
      playQuestion(questions[currentQuestionIndex].text);
    }
  };

  if (isGeneratingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">Generating Questions</h2>
            <p className="text-muted-foreground">Our AI is preparing personalized interview questions for you...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-muted-foreground">Failed to generate questions. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
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
                    {questions[currentQuestionIndex]?.text}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleReplayQuestion}
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
            {/* Enhanced Response Composer */}
            <ResponseComposer
              onSubmitResponse={handleEnhancedResponse}
              isProcessing={isProcessing}
              disabled={isSpeaking}
            />

            {/* Navigation */}
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleNextQuestion}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                </Button>
                
                <Button
                  onClick={handleFinishInterview}
                  variant="destructive"
                  className="w-full"
                  disabled={isProcessing}
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
