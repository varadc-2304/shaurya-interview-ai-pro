import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Text } from 'lucide-react';

interface TextEditorProps {
  onSave: (text: string) => void;
  initialText?: string;
}

const TextEditor = ({ onSave, initialText = '' }: TextEditorProps) => {
  const [textContent, setTextContent] = useState(initialText);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(textContent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Text className="h-4 w-4" />
          <span>Text Editor</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Text Editor</DialogTitle>
          <DialogDescription>
            Write your detailed response here. You can explain your thoughts, approach, or provide additional context.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Type your response here..."
            className="min-h-[300px] resize-none"
          />
          <div className="text-sm text-muted-foreground">
            Characters: {textContent.length}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextEditor;
