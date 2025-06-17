'use client';

import { Button } from "@/components/ui";
import { controlLoop } from "@/lib/controlLoop";

export function StartButton() {
  const handleStart = () => {
    controlLoop();
  };

  return (
    <Button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700">
      Start Control Loop
    </Button>
  );
} 