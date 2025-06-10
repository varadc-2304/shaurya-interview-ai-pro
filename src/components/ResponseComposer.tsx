
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CodeEditor from './CodeEditor';
import TextEditor from './TextEditor';
import { Mic, MicOff, Code, FileText, Send, Trash2 } from 'lucide-react';

interface ResponseComposerProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitResponse: (response: {
    speechText: string;
    codeContent: string;
    textContent: string;
  }) => void;
  speechText: string;
}

const ResponseComposer = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  onSubmitResponse,
  speechText
}: ResponseComposerProps) => {
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [textContent, setTextContent] = useState('');

  const handleSubmit = () => {
    onSubmitResponse({
      speechText,
      codeContent,
      textContent
    });
    
    // Reset content after submission
    setCodeContent('');
    setTextContent('');
  };

  const handleClearAll = () => {
    setCodeContent('');
    setTextContent('');
  };

  const hasContent = speechText || codeContent || textContent;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Your Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="flex-1"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </div>

          {/* Editor Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setIsTextEditorOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Text Editor
            </Button>
            <Button
              onClick={() => setIsCodeEditorOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <Code className="h-4 w-4 mr-2" />
              Code Editor
            </Button>
          </div>

          {/* Content Preview */}
          {hasContent && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Response Content:</h4>
                <Button
                  onClick={handleClearAll}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              
              {speechText && (
                <div>
                  <Badge variant="secondary" className="mb-2">Speech</Badge>
                  <p className="text-sm bg-background p-2 rounded border">
                    {speechText}
                  </p>
                </div>
              )}
              
              {textContent && (
                <div>
                  <Badge variant="secondary" className="mb-2">Text</Badge>
                  <p className="text-sm bg-background p-2 rounded border whitespace-pre-wrap">
                    {textContent}
                  </p>
                </div>
              )}
              
              {codeContent && (
                <div>
                  <Badge variant="secondary" className="mb-2">Code</Badge>
                  <pre className="text-sm bg-background p-2 rounded border overflow-x-auto">
                    <code>{codeContent}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!hasContent}
            className="w-full"
            size="lg"
          >
            <Send className="h-5 w-5 mr-2" />
            Submit Response
          </Button>
        </CardContent>
      </Card>

      {/* Editors */}
      <CodeEditor
        isOpen={isCodeEditorOpen}
        onClose={() => setIsCodeEditorOpen(false)}
        onSave={setCodeContent}
        initialCode={codeContent}
      />

      <TextEditor
        isOpen={isTextEditorOpen}
        onClose={() => setIsTextEditorOpen(false)}
        onSave={setTextContent}
        initialText={textContent}
      />
    </>
  );
};

export default ResponseComposer;
