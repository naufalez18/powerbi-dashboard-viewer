import React from 'react';
import { Clock } from 'lucide-react';

interface CooldownTimerProps {
  timeRemaining: number;
  totalTime: number;
  isActive: boolean;
}

export function CooldownTimer({ timeRemaining, totalTime, isActive }: CooldownTimerProps) {
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (timeRemaining <= 10) return 'bg-red-500';
    if (timeRemaining <= 30) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getGlowColor = () => {
    if (timeRemaining <= 10) return 'shadow-red-500/50';
    if (timeRemaining <= 30) return 'shadow-yellow-500/50';
    return 'shadow-blue-500/50';
  };

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-50 -translate-y-2'
      }`}
      role="timer"
      aria-label={`Next dashboard in ${formatTime(timeRemaining)}`}
    >
      <div className={`bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg ${getGlowColor()} border border-gray-200`}>
        <div className="flex items-center space-x-3">
          {/* Clock Icon */}
          <div className="relative">
            <Clock className={`h-5 w-5 ${isActive ? 'text-gray-700' : 'text-gray-400'} transition-colors duration-300`} />
            {isActive && (
              <div className="absolute inset-0 animate-pulse">
                <Clock className="h-5 w-5 text-blue-500 opacity-50" />
              </div>
            )}
          </div>

          {/* Time Display */}
          <div className="flex flex-col items-center">
            <span className={`text-sm font-mono font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'} transition-colors duration-300`}>
              {formatTime(timeRemaining)}
            </span>
            <span className="text-xs text-gray-500">
              next rotation
            </span>
          </div>

          {/* Progress Ring */}
          <div className="relative w-8 h-8">
            {/* Background circle */}
            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ease-linear ${
                  timeRemaining <= 10 ? 'text-red-500' : 
                  timeRemaining <= 30 ? 'text-yellow-500' : 
                  'text-blue-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center dot */}
            <div className={`absolute inset-0 flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? getProgressColor() : 'bg-gray-300'
              } ${isActive && timeRemaining <= 10 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Indicator */}
        {!isActive && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" 
                 title="Paused - User is active" />
          </div>
        )}
      </div>

      {/* Pulse animation for urgent countdown */}
      {isActive && timeRemaining <= 5 && (
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
      )}
    </div>
  );
}
