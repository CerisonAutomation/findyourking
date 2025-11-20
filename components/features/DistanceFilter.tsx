'use client';

/**
 * DISTANCE FILTER - CORE DATING APP FEATURE
 * Filter matches by distance radius
 */

import { useState } from 'react';
import { Ruler } from 'lucide-react';

interface DistanceFilterProps {
  currentDistance: number;
  onDistanceChange: (distance: number) => void;
  maxDistance?: number;
}

const DISTANCE_PRESETS = [1, 5, 10, 25, 50, 100, 250];

export default function DistanceFilter({
  currentDistance,
  onDistanceChange,
  maxDistance = 250,
}: DistanceFilterProps) {
  const [distance, setDistance] = useState(currentDistance);

  const handleChange = (value: number) => {
    setDistance(value);
    onDistanceChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Distance
        </label>
        <span className="text-sm font-bold text-pink-500">
          {distance === maxDistance ? `${distance}+ km` : `${distance} km`}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="1"
        max={maxDistance}
        value={distance}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
        style={{
          background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(236, 72, 153) ${
            (distance / maxDistance) * 100
          }%, rgb(229, 231, 235) ${(distance / maxDistance) * 100}%, rgb(229, 231, 235) 100%)`,
        }}
      />

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {DISTANCE_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => handleChange(preset)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              distance === preset
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {preset}km
          </button>
        ))}
      </div>
    </div>
  );
}
