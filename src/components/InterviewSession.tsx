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
  type: string;
  difficulty: string;
  focus_area: string;
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
      console.log("User ID for personalization:", userId);
      
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          jobRole: config.jobRole,
          domain: config.domain,
          experienceLevel: config.experienceLevel,
          interviewType: config.questionType,
          additionalConstraints: config.additionalConstraints,
          numQuestions: totalQuestions,
          userId: userId
        }
      });

      console.log("Generate questions response:", data, error);

      if (error) throw error;

      if (data?.questions) {
        const questionList = data.questions.map((q: any, index: number) => ({
          id: `q${index + 1}`,
          text: q.question,
          number: index + 1,
          type: q.type || 'general',
          difficulty: q.difficulty || 'medium',
          focus_area: q.focus_area || config.domain
        }));
        
        setQuestions(questionList);
        
        if (data.resumePersonalized) {
          console.log("Questions were personalized based on user's resume");
          toast({
            title: "Personalized Questions",
            description: "Questions have been tailored based on your resume.",
          });
        }
        
        for (const question of questionList) {
          await supabase.from('interview_questions').insert({
            interview_id: interviewId,
            question_number: question.number,
            question_text: question.text
          });
        }
        
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
      
      if (response.audioBlob) {
        console.log('Processing audio, size:', response.audioBlob.size);
        
        const fileName = `interview_${interviewId}_q${currentQuestionIndex + 1}_${Date.now()}.webm`;
        console.log('Uploading to storage with filename:', fileName);

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

        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(fileName);

        console.log('Public URL obtained:', publicUrl);

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

        await supabase.storage
          .from('audio_files')
          .remove([fileName]);
      }

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

      const currentQuestion = questions[currentQuestionIndex];
      await evaluateResponse(currentQuestion, combinedResponse);
      
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
          domain: config.domain,
          experienceLevel: config.experienceLevel
        }
      });

      if (error) throw error;

      console.log('Evaluation result:', data);

      const { error: updateError } = await supabase
        .from('interview_questions')
        .update({
          evaluation_score: data.score,
          evaluation_feedback: data.detailed_feedback,
          strengths: data.strengths,
          improvements: data.improvements,
          performance_level: data.performance_level,
          recommendation: data.recommendation
        })
        .eq('interview_id', interviewId)
        .eq('question_number', question.number);

      if (updateError) {
        console.error('Error updating question with evaluation:', updateError);
        throw updateError;
      }

      console.log('Successfully saved evaluation to database');

    } catch (error) {
      console.error('Error evaluating response:', error);
      
      await supabase
        .from('interview_questions')
        .update({
          evaluation_score: 50,
          evaluation_feedback: 'Evaluation failed - technical issue',
          strengths: ['Attempted the question'],
          improvements: ['Please try again'],
          performance_level: 'Needs Improvement',
          recommendation: 'Maybe'
        })
        .eq('interview_id', interviewId)
        .eq('question_number', question.number);
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

      // Calculate and store overall interview results
      console.log('Calculating interview results...');
      const { data: resultId, error: resultError } = await supabase.rpc(
        'calculate_interview_results', 
        { p_interview_id: interviewId }
      );

      if (resultError) {
        console.error('Error calculating interview results:', resultError);
      } else {
        console.log('Interview results calculated successfully:', resultId);
      }

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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-hidden">
      <div className="flex-none py-3 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl px-6 py-3 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">AI Interview</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span>{config.jobRole}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{config.domain}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border-blue-200 px-4 py-1">
                Q{currentQuestionIndex + 1}/{totalQuestions}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="max-w-6xl w-full">
          <div className="grid grid-cols-2 gap-8 h-[360px]">
            <div className="flex items-center justify-center">
              <CameraFeed className="w-full h-full" />
            </div>

            <div className="flex items-center justify-center">
              <AIAvatar 
                isSpeaking={isSpeaking} 
                className="w-full h-full" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-none">
        <FloatingControls
          onSubmitResponse={handleEnhancedResponse}
          onNextQuestion={handleNextQuestion}
          onEndInterview={handleFinishInterview}
          isProcessing={isProcessing}
          disabled={isSpeaking}
          duration={duration}
        />
      </div>
    </div>
  );
};

export default InterviewSession;
