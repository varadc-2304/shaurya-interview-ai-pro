
import { Editor } from '@monaco-editor/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Code, Check, X } from 'lucide-react';

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: string) => void;
  initialCode?: string;
  language?: string;
}

const CodeEditor = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialCode = '', 
  language = 'javascript' 
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);

  const handleSave = () => {
    onSave(code);
    onClose();
  };

  const handleCancel = () => {
    setCode(initialCode);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[400px] border rounded-md overflow-hidden">
          <Editor
            height="400px"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Save Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CodeEditor;
