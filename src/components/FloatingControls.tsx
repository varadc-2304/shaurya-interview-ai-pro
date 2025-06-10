
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  duration: number;
}

const FloatingControls = ({
  onSubmitResponse,
  onNextQuestion,
  onEndInterview,
  isProcessing,
  disabled = false,
  duration
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
      {/* Compact Controls */}
      <div className="px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center space-x-6">
            {/* Timer */}
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="font-medium text-sm">{formatTime(duration)}</span>
            </div>

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
              className={`w-14 h-14 rounded-full transition-all duration-300 relative ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={disabled || isProcessing}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              {response.hasAudio && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </Button>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!hasAnyContent || isProcessing || disabled || isRecording}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* Next Question - Disabled when audio is playing */}
            <Button
              onClick={onNextQuestion}
              variant="outline"
              disabled={isProcessing || disabled}
              className={`w-12 h-12 rounded-full ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
              title={disabled ? "Please wait for the question to finish" : "Next question"}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            {/* End Interview */}
            <Button
              onClick={onEndInterview}
              variant="destructive"
              disabled={isProcessing}
              className="w-12 h-12 rounded-full"
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
