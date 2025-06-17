'use client';

import { Button } from "@/components/ui";
import { controlLoop } from "@/lib/controlLoop";

export function StartButton() {
  const handleStart = () => {
    controlLoop();
  };

  return (
    <Button onClick={handleStart} className="bg-green-600 hover:bg-green-700">
      Start Control Loop
    </Button>
  );
} 