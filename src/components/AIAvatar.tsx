
import { useState, useEffect } from 'react';
import { Bot, Volume2 } from 'lucide-react';

interface AIAvatarProps {
  isSpeaking?: boolean;
  className?: string;
}

const AIAvatar = ({ isSpeaking = false, className = '' }: AIAvatarProps) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle');

  useEffect(() => {
    setCurrentAnimation(isSpeaking ? 'speaking' : 'idle');
  }, [isSpeaking]);

  return (
    <div className={`relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 ${className}`}>
      {/* Minimal Header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
          <span className="text-gray-700 text-sm font-medium flex items-center">
            <Bot className="h-4 w-4 mr-2 text-blue-600" />
            AI Interviewer
          </span>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-blue-500 rounded-full px-3 py-1 flex items-center animate-pulse">
            <Volume2 className="h-4 w-4 text-white mr-2" />
            <span className="text-white text-xs font-medium">SPEAKING</span>
          </div>
        </div>
      )}

      {/* Avatar Container */}
      <div className="w-full h-full flex items-center justify-center relative bg-gradient-to-br from-blue-50 to-white">
        {/* AI Avatar Image */}
        <div className={`relative transition-all duration-1000 ${
          currentAnimation === 'speaking' 
            ? 'scale-105' 
            : 'scale-100'
        }`}>
          <img
            src="/AI_Avtar.jpeg"
            alt="AI Interviewer"
            className={`w-80 h-80 object-cover rounded-full transition-all duration-1000 ${
              currentAnimation === 'speaking' 
                ? 'shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/30' 
                : 'shadow-xl'
            }`}
          />
          
          {/* Animated ring effect when speaking */}
          {isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
              <div className="absolute inset-0 rounded-full border border-blue-300 animate-pulse opacity-50" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAvatar;
