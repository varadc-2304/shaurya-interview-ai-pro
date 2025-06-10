
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface QuestionTimerProps {
  duration: number; // in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
  isVisible?: boolean;
}

const QuestionTimer = ({ 
  duration, 
  onTimeUp, 
  isPaused = false, 
  isVisible = true 
}: QuestionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(true);
  }, [duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            onTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const getTimeColor = () => {
    if (timeLeft <= 30) return 'text-red-600';
    if (timeLeft <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (timeLeft <= 30) return 'bg-red-500';
    if (timeLeft <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs">Question Timer</span>
        </Badge>
        <span className={`font-mono font-bold text-lg ${getTimeColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={getProgressValue()} 
          className="h-2" 
        />
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
          style={{ width: `${getProgressValue()}%` }}
        />
      </div>
      
      {timeLeft <= 30 && (
        <p className="text-red-500 text-xs mt-2 text-center animate-pulse">
          Time running out!
        </p>
      )}
    </div>
  );
};

export default QuestionTimer;
