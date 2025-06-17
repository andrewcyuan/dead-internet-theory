import { runSim } from "./simRunner";

export async function controlLoop(cycles: number = 5): Promise<void> {
  // Create an array of 5 runSim promises
  const simPromises = Array(5).fill(null).map(() => 
    runSim({
      maxPosts: cycles,
    })
  );

  // Execute all 5 simulations concurrently
  await Promise.all(simPromises);
} 