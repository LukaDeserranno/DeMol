import React, { useState, useEffect } from 'react';
import { Candidate } from '@/models/candidate';

interface VotingSliderProps {
  candidate: Candidate;
  points: number;
  onChange: (candidateId: string, points: number) => void;
  disabled?: boolean;
  maxPoints: number;
  availablePoints: number; // Maximum points the user can assign (based on remaining points)
}

export function VotingSlider({ 
  candidate, 
  points, 
  onChange, 
  disabled = false,
  maxPoints,
  availablePoints // How many points are available to assign
}: VotingSliderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(points);
  const [showSnap, setShowSnap] = useState(false);
  
  // The maximum value this slider can be set to
  const effectiveMaxValue = Math.min(maxPoints, points + availablePoints);
  
  // Can still decrease even if no points are available
  const isEffectivelyDisabled = disabled || (availablePoints === 0 && points === 0);
  
  // Update display value when points change from parent
  useEffect(() => {
    setDisplayValue(points);
  }, [points]);
  
  // Update display value when available points change
  useEffect(() => {
    // If current display value exceeds the new maximum, cap it
    if (displayValue > points + availablePoints) {
      setDisplayValue(points + availablePoints);
    }
  }, [availablePoints, points, displayValue]);
  
  // Reset snap animation
  useEffect(() => {
    if (showSnap) {
      const timer = setTimeout(() => {
        setShowSnap(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showSnap]);
  
  // Add some custom drag handling to ensure sliding works properly
  const [isDraggingValue, setIsDraggingValue] = useState<number | null>(null);
  
  const handleMouseDown = () => {
    setIsDragging(true);
    // Store the current value when starting to drag
    setIsDraggingValue(displayValue);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingValue(null);
  };
  
  // Handle slider change with step = 5
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get raw value from slider
    const rawValue = parseInt(e.target.value, 10);
    
    // Round to nearest 5
    const roundedValue = Math.round(rawValue / 5) * 5;
    
    // Don't allow increasing if no points are available, but always allow decreasing
    let clampedValue;
    
    // We're decreasing if the new value is less than either the current display value
    // or the value when we started dragging
    const isDecreasing = roundedValue < displayValue || 
      (isDraggingValue !== null && roundedValue < isDraggingValue);
      
    if (availablePoints === 0 && !isDecreasing) {
      // No points available and not decreasing, can't go beyond current
      clampedValue = points;
    } else {
      // Either decreasing or we have points to allocate
      clampedValue = Math.min(roundedValue, effectiveMaxValue);
    }
    
    // Show snapping animation if value changed
    if (clampedValue !== displayValue) {
      setShowSnap(true);
    }
    
    // Update the display value immediately
    setDisplayValue(clampedValue);
    
    // Update the actual value
    onChange(candidate.id, clampedValue);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(0, displayValue - 5);
      setDisplayValue(newValue);
      onChange(candidate.id, newValue);
      setShowSnap(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(effectiveMaxValue, displayValue + 5);
      setDisplayValue(newValue);
      onChange(candidate.id, newValue);
      setShowSnap(true);
    }
  };
  
  // Calculate percentage for styles (based on display value, not points)
  const percentage = (displayValue / maxPoints) * 100;
  
  // Generate color based on display value
  const getColor = () => {
    // Start with a low-intensity color at 0 points
    // and progress to high-intensity color at maxPoints
    if (displayValue <= 0) return '#2d3748'; // Dark gray for zero points
    if (displayValue < 25) return '#38b2ac'; // Teal for low points
    if (displayValue < 50) return '#319795'; // Deeper teal for medium-low
    if (displayValue < 75) return '#2c7a7b'; // Deep teal for medium
    return '#2A9D8F'; // Brand color for high points
  };

  // Determine background gradient for the slider track
  const trackBackground = `linear-gradient(to right, 
    ${getColor()} ${percentage}%, 
    #4a5568 ${percentage}% ${effectiveMaxValue < maxPoints ? `${(effectiveMaxValue / maxPoints) * 100}%` : ''}, 
    ${effectiveMaxValue < maxPoints ? '#3a3f4b' : '#4a5568'} ${effectiveMaxValue < maxPoints ? `${(effectiveMaxValue / maxPoints) * 100}%` : ''}
  )`;
  
  return (
    <div 
      className={`
        flex flex-col p-3 sm:p-5 rounded-lg transition-all duration-300 ease-in-out backdrop-blur-sm
        ${isDragging 
          ? 'bg-zinc-800/90 shadow-lg scale-[1.01] border border-[#2A9D8F]/40' 
          : isHovering 
            ? 'bg-zinc-800/70 shadow-md scale-[1.005] border border-zinc-700/60' 
            : 'bg-zinc-800/50 border border-zinc-800/10'
        }
      `}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsDragging(false);
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Image with glow effect when high points */}
          <div className={`
            relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden
            ${displayValue > 50 ? 'ring-2 ring-[#2A9D8F]/60 ring-offset-2 ring-offset-zinc-900' : ''}
            transition-all duration-300
          `}>
            {displayValue > 50 && (
              <div className="absolute inset-0 bg-[#2A9D8F]/20 animate-pulse"></div>
            )}
            <img 
              src={candidate.image} 
              alt={candidate.name} 
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
              }}
            />
          </div>
          
          <div>
            <h3 className="font-medium text-white text-base sm:text-lg mb-0.5 sm:mb-1 flex items-center flex-wrap gap-2">
              {candidate.name}
              {displayValue >= 75 && (
                <span className="text-xs bg-[#2A9D8F]/20 text-[#2A9D8F] px-2 py-0.5 rounded-full border border-[#2A9D8F]/30">
                  Verdacht
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              {candidate.age} jaar{candidate.occupation ? ` • ${candidate.occupation}` : ''}
            </p>
          </div>
        </div>
        
        {/* Points display with animation */}
        <div className={`
          relative min-w-[3rem] text-center mt-1 sm:mt-0
          ${showSnap ? 'animate-bounce-mini' : ''}
        `}>
          <div className={`
            text-2xl sm:text-3xl font-bold transition-all duration-300 ease-in-out
            ${displayValue > 75 
              ? 'text-[#2A9D8F] scale-110' 
              : displayValue > 50 
                ? 'text-[#2A9D8F]/90' 
                : displayValue > 25 
                  ? 'text-[#2A9D8F]/70' 
                  : 'text-zinc-400'
            }
          `}>
            {displayValue}
          </div>
          <div className="text-xs text-zinc-500 absolute -bottom-5 left-0 right-0">
            punten
          </div>
        </div>
      </div>
      
      {/* Available points indicator */}
      {!disabled && (
        <div className="flex justify-between items-center mb-1">
          <div>
            {availablePoints === 0 && points > 0 && (
              <span className="text-xs text-amber-500">
                ← Verminder om punten vrij te maken
              </span>
            )}
          </div>
          <span className={`
            text-xs px-2 py-0.5 rounded-full 
            ${availablePoints > 0 
              ? 'text-green-400 bg-green-900/20 border border-green-800/30' 
              : 'text-zinc-400 bg-zinc-800/80 border border-zinc-700/50'
            }
          `}>
            {availablePoints > 0 
              ? `${availablePoints} punten beschikbaar` 
              : 'Geen punten beschikbaar'}
          </span>
        </div>
      )}
      
      {/* Custom slider container */}
      <div className="relative pt-1 pb-5">
        {/* Slider track and thumb */}
        <input
          type="range"
          min="0"
          max={maxPoints}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          step="5"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`
            w-full h-2 appearance-none rounded-lg cursor-pointer 
            focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/50 focus:ring-offset-1 focus:ring-offset-zinc-900
            ${isEffectivelyDisabled ? 'opacity-70' : ''}
          `}
          style={{ 
            background: trackBackground,
            WebkitAppearance: 'none',
          }}
        />
        
        {/* Effective max marker */}
        {effectiveMaxValue < maxPoints && !disabled && (
          <div className="absolute top-0 flex flex-col items-center justify-center" style={{ 
            left: `calc(${(effectiveMaxValue / maxPoints) * 100}%)`,
            transform: 'translateX(-50%)',
            zIndex: 5 
          }}>
            <div className="h-6 border-l border-dashed border-zinc-500/70"></div>
            <div className="text-xs text-zinc-500 mt-0.5 px-1 py-0.5 bg-zinc-800/80 rounded whitespace-nowrap">
              Max {effectiveMaxValue}
            </div>
          </div>
        )}
        
        {/* Tick marks and snap points - hide small ticks on mobile */}
        <div className="flex justify-between w-full px-1 mt-2">
          {Array.from({ length: maxPoints / 5 + 1 }).map((_, i) => {
            const value = i * 5;
            const isMajorTick = value % 25 === 0;
            const isWithinLimit = value <= effectiveMaxValue;
            const hideOnMobile = !isMajorTick && window.innerWidth < 640;
            
            return (
              <div 
                key={i} 
                className={`
                  ${isMajorTick ? 'h-2 w-1' : 'h-1 w-0.5 hidden sm:block'} 
                  rounded-full 
                  transition-colors duration-300
                  ${value <= displayValue 
                    ? isMajorTick 
                      ? 'bg-[#2A9D8F]' 
                      : 'bg-[#2A9D8F]/70' 
                    : isWithinLimit
                      ? isMajorTick 
                        ? 'bg-zinc-600' 
                        : 'bg-zinc-700'
                      : isMajorTick
                        ? 'bg-zinc-700/50'
                        : 'bg-zinc-800/50'
                  }
                  ${value === displayValue && !isEffectivelyDisabled ? 'animate-ping-mini' : ''}
                `}
              />
            );
          })}
        </div>
        
        {/* Slider labels - only show major values */}
        <div className="flex justify-between text-xs mt-2">
          <span className={`text-zinc-500 ${displayValue === 0 ? 'font-medium text-zinc-300' : ''}`}>0</span>
          <span className={`text-zinc-500 ${displayValue === 25 ? 'font-medium text-zinc-300' : ''}`}>25</span>
          <span className={`text-zinc-500 ${displayValue === 50 ? 'font-medium text-zinc-300' : ''}`}>50</span>
          <span className={`text-zinc-500 ${displayValue === 75 ? 'font-medium text-zinc-300' : ''}`}>75</span>
          <span className={`text-zinc-500 ${displayValue === 100 ? 'font-medium text-zinc-300' : ''}`}>100</span>
        </div>
      </div>
      
      {/* Keyboard controls hint - only shown when hovering or focused */}
      {(isHovering || isDragging) && !disabled && !isEffectivelyDisabled && (
        <div className="text-xs text-zinc-500 mt-1 text-center transition-opacity duration-300 backdrop-blur-sm bg-zinc-900/30 py-1 rounded-md">
          <span>Gebruik ← → pijltjes of klik op de streepjes voor stapjes van 5 punten</span>
        </div>
      )}
    </div>
  );
} 