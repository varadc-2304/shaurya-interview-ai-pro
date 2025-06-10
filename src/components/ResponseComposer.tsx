
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Send,
  Brain,
  CheckCircle
} from 'lucide-react';
import { useEnhancedResponse } from '@/hooks/useEnhancedResponse';
import CodeEditor from './CodeEditor';
import TextEditor from './TextEditor';
import { useToast } from '@/hooks/use-toast';

interface ResponseComposerProps {
  onSubmitResponse: (response: {
    audioBlob: Blob | null;
    textContent: string;
    codeContent: string;
    codeLanguage: string;
  }) => Promise<void>;
  isProcessing: boolean;
  disabled?: boolean;
}

const ResponseComposer = ({ onSubmitResponse, isProcessing, disabled = false }: ResponseComposerProps) => {
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
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg">Your Response</CardTitle>
        <CardDescription>
          Provide your answer using audio, text, code, or any combination
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Recording */}
        <div className="space-y-3">
          <div className="flex justify-center">
            <Button
              onClick={isRecording ? stopRecording : handleStartRecording}
              size="lg"
              className={`w-20 h-20 rounded-full ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'shaurya-gradient hover:opacity-90'
              } transition-all`}
              disabled={disabled || isProcessing}
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
              {isRecording ? "Recording... Click to stop" : "Click to start recording"}
            </p>
            {response.hasAudio && (
              <Badge variant="secondary" className="mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Audio recorded
              </Badge>
            )}
          </div>
        </div>

        {/* Editor Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <TextEditor
              onSave={updateTextContent}
              initialText={response.textContent}
            />
            {response.hasText && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Text added
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <CodeEditor
              onSave={updateCodeContent}
              initialCode={response.codeContent}
              initialLanguage={response.codeLanguage}
            />
            {response.hasCode && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Code added ({response.codeLanguage})
              </Badge>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!hasAnyContent || isProcessing || disabled || isRecording}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Brain className="mr-2 h-4 w-4 animate-spin" />
                Processing Response...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Response
              </>
            )}
          </Button>
          
          {hasAnyContent && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Response includes: {[
                response.hasAudio && 'Audio',
                response.hasText && 'Text',
                response.hasCode && `Code (${response.codeLanguage})`
              ].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseComposer;
