
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
    <div className={`relative bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-white text-sm font-medium flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            AI Interviewer
          </span>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 rounded-full p-2 animate-pulse">
            <Volume2 className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Avatar Container */}
      <div className="w-full h-full flex items-center justify-center relative">
        {/* AI Avatar Image */}
        <div className={`relative transition-all duration-1000 ${
          currentAnimation === 'speaking' 
            ? 'scale-105 shadow-2xl shadow-blue-500/30' 
            : 'scale-100'
        }`}>
          <img
            src="/AI_Avtar.jpeg"
            alt="AI Interviewer"
            className={`w-64 h-64 object-cover rounded-full border-4 border-white/20 transition-all duration-1000 ${
              currentAnimation === 'speaking' 
                ? 'shadow-2xl shadow-blue-400/50 ring-4 ring-blue-400/30' 
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

        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent transition-opacity duration-1000 ${
          currentAnimation === 'speaking' ? 'opacity-60' : 'opacity-40'
        }`} />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent" />
        </div>
      </div>

      {/* Ambient light effect */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        currentAnimation === 'speaking'
          ? 'bg-blue-400/5 shadow-inner'
          : 'bg-blue-500/2'
      }`} />
    </div>
  );
};

export default AIAvatar;
