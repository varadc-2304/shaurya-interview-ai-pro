
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      {/* Progress Bar */}
      <div className="px-8 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">{formatTime(duration)}</span>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                {currentQuestion} / {totalQuestions}
              </Badge>
            </div>
            <span className="text-gray-500 font-medium text-sm">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Main Controls */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-8">
            {/* Text Editor */}
            <div className="relative">
              <TextEditor
                onSave={updateTextContent}
                initialText={response.textContent}
              />
              {response.hasText && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            {/* Code Editor */}
            <div className="relative">
              <CodeEditor
                onSave={updateCodeContent}
                initialCode={response.codeContent}
                initialLanguage={response.codeLanguage}
              />
              {response.hasCode && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            {/* Main Recording Button */}
            <Button
              onClick={isRecording ? stopRecording : handleStartRecording}
              size="lg"
              className={`w-16 h-16 rounded-full transition-all duration-300 relative ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={disabled || isProcessing}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
              {response.hasAudio && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </Button>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!hasAnyContent || isProcessing || disabled || isRecording}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* Next Question */}
            <Button
              onClick={onNextQuestion}
              variant="outline"
              disabled={isProcessing}
              className="px-4 py-3 rounded-xl"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            {/* End Interview */}
            <Button
              onClick={onEndInterview}
              variant="destructive"
              disabled={isProcessing}
              size="sm"
              className="px-4 py-3 rounded-xl"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingControls;
