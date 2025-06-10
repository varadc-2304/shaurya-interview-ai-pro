import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { InterviewConfig } from "./InterviewSetup";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CameraFeed from './CameraFeed';
import AIAvatar from './AIAvatar';
import FloatingControls from './FloatingControls';

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

  if (isGeneratingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-16 shadow-xl border border-gray-100 max-w-md">
          <Brain className="h-20 w-20 mx-auto mb-8 text-blue-600 animate-pulse" />
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Preparing Your Interview</h2>
          <p className="text-gray-600 text-lg mb-8">Our AI is generating personalized questions...</p>
          <div className="space-y-3">
            <Badge variant="secondary" className="px-6 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
              {config.jobRole}
            </Badge>
            <Badge variant="secondary" className="px-6 py-2 text-sm bg-blue-50 text-blue-700 border-blue-200">
              {config.domain}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-16 shadow-xl border border-gray-100 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-600">Failed to generate questions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Minimal Header */}
      <div className="flex-none py-6 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-lg border border-gray-200">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Interview Session</h1>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">{config.jobRole}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="font-medium">{config.domain}</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {config.questionType}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Video Feeds */}
      <div className="flex-1 flex items-center justify-center px-8 pb-40">
        <div className="max-w-7xl w-full">
          <div className="grid grid-cols-2 gap-12 h-[500px]">
            {/* Left Side - User Camera */}
            <div className="flex items-center justify-center">
              <CameraFeed className="w-full h-full max-w-2xl" />
            </div>

            {/* Right Side - AI Avatar */}
            <div className="flex items-center justify-center">
              <AIAvatar 
                isSpeaking={isSpeaking} 
                className="w-full h-full max-w-2xl" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Controls - Fixed at bottom with proper spacing */}
      <div className="flex-none">
        <FloatingControls
          onSubmitResponse={handleEnhancedResponse}
          onNextQuestion={handleNextQuestion}
          onEndInterview={handleFinishInterview}
          isProcessing={isProcessing}
          disabled={isSpeaking}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          duration={duration}
          progress={progress}
        />
      </div>
    </div>
  );
};

export default InterviewSession;

}
