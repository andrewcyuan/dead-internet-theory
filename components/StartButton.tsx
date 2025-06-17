'use client';

import { useState } from 'react';
import { Button, Input } from "@/components/ui";
import { controlLoop } from "@/lib/controlLoop";

export function StartButton() {
  const [cycles, setCycles] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = async () => {
    setIsRunning(true);
    try {
      await controlLoop(cycles);
    } catch (error) {
      console.error('Control loop error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="cycles" className="text-sm font-medium text-gray-700">
          Cycles:
        </label>
        <Input
          id="cycles"
          type="number"
          min="1"
          max="100"
          value={cycles}
          onChange={(e) => setCycles(parseInt(e.target.value) || 1)}
          className="w-20 h-9"
          disabled={isRunning}
        />
      </div>
      <Button 
        onClick={handleStart} 
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        disabled={isRunning}
      >
        {isRunning ? 'Running...' : 'Begin Simulation'}
      </Button>
    </div>
=======
    <Button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
      Start Control Loop
    </Button>
>>>>>>> refs/remotes/origin/main
  );
} 