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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

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
        // Fix: Extract the 'question' property from each question object
        const questionList = data.questions.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          text: q.question, // Extract the 'question' property, not the whole object
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioRecorded(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    try {
      console.log("Processing audio blob:", audioBlob.size, "bytes");

      // Upload to Supabase storage with user folder structure
      const fileName = `${userId}/interview_${interviewId}_q${currentQuestionIndex + 1}_${Date.now()}.webm`;
      console.log("Uploading to:", fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Convert audio blob to base64 for speech-to-text processing
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));
      
      console.log("Sending audio to speech-to-text, size:", base64Audio.length);
      
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      console.log("Speech-to-text response:", data, error);

      if (error) {
        console.error("Speech-to-text error:", error);
        throw error;
      }

      const userResponse = data?.text || '';
      console.log("Transcribed text:", userResponse);
      
      if (!userResponse.trim()) {
        toast({
          title: "No Speech Detected",
          description: "Please try recording your response again.",
          variant: "destructive"
        });
        return;
      }
      
      // Evaluate response
      const currentQuestion = questions[currentQuestionIndex];
      await evaluateResponse(currentQuestion, userResponse);
      
      // Update interview question with response
      await supabase
        .from('interview_questions')
        .update({
          user_response: userResponse
        })
        .eq('interview_id', interviewId)
        .eq('question_number', currentQuestionIndex + 1);

      toast({
        title: "Response Recorded",
        description: "Your answer has been processed successfully.",
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const evaluateResponse = async (question: Question, userResponse: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-response', {
        body: {
          question: question.text,
          answer: userResponse,
          jobRole: config.jobRole,
          domain: config.domain
        }
      });

      if (error) throw error;

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
            {/* Recording Controls */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Your Response</CardTitle>
                <CardDescription>Record your answer to the question</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    className={`w-20 h-20 rounded-full ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'shaurya-gradient hover:opacity-90'
                    } transition-all`}
                    disabled={isProcessing || isSpeaking}
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
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
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
