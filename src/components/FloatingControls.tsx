
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Send,
  Brain,
  CheckCircle,
  SkipForward,
  StopCircle,
  Clock
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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main Controls Glass Panel */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 mx-4">
        <div className="flex flex-col space-y-6">
          {/* Progress and Info Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(duration)}</span>
              </div>
              <Badge variant="secondary">
                Question {currentQuestion} of {totalQuestions}
              </Badge>
            </div>
            <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Main Control Row */}
          <div className="flex items-center justify-center space-x-6">
            {/* Text Editor */}
            <div className="flex flex-col items-center space-y-2">
              <TextEditor
                onSave={updateTextContent}
                initialText={response.textContent}
              />
              {response.hasText && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Text
                </Badge>
              )}
            </div>

            {/* Main Recording Button */}
            <div className="flex flex-col items-center space-y-2">
              <Button
                onClick={isRecording ? stopRecording : handleStartRecording}
                size="lg"
                className={`w-20 h-20 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30' 
                    : 'shaurya-gradient hover:opacity-90 shadow-lg shadow-blue-500/30'
                } transition-all duration-300 transform hover:scale-105`}
                disabled={disabled || isProcessing}
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                {isRecording ? "Recording... Click to stop" : "Click to record"}
              </p>
              
              {response.hasAudio && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Audio
                </Badge>
              )}
            </div>

            {/* Code Editor */}
            <div className="flex flex-col items-center space-y-2">
              <CodeEditor
                onSave={updateCodeContent}
                initialCode={response.codeContent}
                initialLanguage={response.codeLanguage}
              />
              {response.hasCode && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Code
                </Badge>
              )}
            </div>
          </div>

          {/* Response Summary */}
          {hasAnyContent && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Response includes: {[
                  response.hasAudio && 'Audio',
                  response.hasText && 'Text',
                  response.hasCode && `Code (${response.codeLanguage})`
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={handleSubmit}
              disabled={!hasAnyContent || isProcessing || disabled || isRecording}
              className="px-8"
            >
              {isProcessing ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-spin" />
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
            >
              <SkipForward className="mr-2 h-4 w-4" />
              {currentQuestion < totalQuestions ? 'Next Question' : 'Finish Interview'}
            </Button>
            
            <Button
              onClick={onEndInterview}
              variant="destructive"
              disabled={isProcessing}
              size="sm"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingControls;
