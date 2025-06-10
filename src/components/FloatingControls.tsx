
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Send,
  SkipForward,
  StopCircle,
  Clock,
  Edit3,
  Code2
} from 'lucide-react';
import TextEditor from './TextEditor';
import CodeEditor from './CodeEditor';
import { useEnhancedResponse } from '@/hooks/useEnhancedResponse';
import { useToast } from '@/hooks/use-toast';

interface FloatingControlsProps {
  onSubmitResponse: (response: {
    audioBlob: Blob | null;
    textContent: string;
    codeContent: string;
    codeLanguage: string;
  }) => Promise<void>;
  onNextQuestion: () => void;
  onEndInterview: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  currentQuestion: number;
  totalQuestions: number;
  duration: number;
  progress: number;
}

const FloatingControls = ({
  onSubmitResponse,
  onNextQuestion,
  onEndInterview,
  isProcessing,
  disabled = false,
  currentQuestion,
  totalQuestions,
  duration,
  progress
}: FloatingControlsProps) => {
  const {
    response,
    isRecording,
    startRecording,
    stopRecording,
    updateTextContent,
    updateCodeContent,
    resetResponse,
    hasAnyContent
  } = useEnhancedResponse();
  
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!hasAnyContent) {
      toast({
        title: "No Response",
        description: "Please provide at least one type of response (audio, text, or code).",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmitResponse({
        audioBlob: response.audioBlob,
        textContent: response.textContent,
        codeContent: response.codeContent,
        codeLanguage: response.codeLanguage
      });
      resetResponse();
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
      {/* Progress Bar - Top */}
      <div className="mb-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{formatTime(duration)}</span>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                Question {currentQuestion} of {totalQuestions}
              </Badge>
            </div>
            <span className="text-gray-500 font-medium">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Controls */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center space-x-8">
          {/* Text Editor */}
          <div className="flex flex-col items-center space-y-3">
            <TextEditor
              onSave={updateTextContent}
              initialText={response.textContent}
            />
            <span className="text-xs text-gray-500 font-medium">Add Text</span>
            {response.hasText && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>

          {/* Main Recording Button */}
          <div className="flex flex-col items-center space-y-4">
            <Button
              onClick={isRecording ? stopRecording : handleStartRecording}
              size="lg"
              className={`w-24 h-24 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
              }`}
              disabled={disabled || isProcessing}
            >
              {isRecording ? (
                <MicOff className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </Button>
            
            <p className="text-sm text-gray-600 font-medium text-center">
              {isRecording ? "Recording..." : "Record Answer"}
            </p>
            
            {response.hasAudio && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex flex-col items-center space-y-3">
            <CodeEditor
              onSave={updateCodeContent}
              initialCode={response.codeContent}
              initialLanguage={response.codeLanguage}
            />
            <span className="text-xs text-gray-500 font-medium">Add Code</span>
            {response.hasCode && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-100">
          <Button
            onClick={handleSubmit}
            disabled={!hasAnyContent || isProcessing || disabled || isRecording}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Response
              </>
            )}
          </Button>

          <Button
            onClick={onNextQuestion}
            variant="outline"
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl border-gray-300"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            {currentQuestion < totalQuestions ? 'Next Question' : 'Finish'}
          </Button>
          
          <Button
            onClick={onEndInterview}
            variant="destructive"
            disabled={isProcessing}
            size="sm"
            className="px-4 py-3 rounded-xl"
          >
            <StopCircle className="mr-2 h-4 w-4" />
            End Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FloatingControls;
