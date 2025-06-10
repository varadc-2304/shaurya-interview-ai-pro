
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Check, X } from 'lucide-react';

interface TextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  placeholder?: string;
}

const TextEditor = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialText = '', 
  placeholder = 'Enter your response here...' 
}: TextEditorProps) => {
  const [text, setText] = useState(initialText);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  const handleCancel = () => {
    setText(initialText);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-h-[300px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Save Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditor;
