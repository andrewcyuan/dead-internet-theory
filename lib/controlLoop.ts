import { runSim } from "./simRunner";

export async function controlLoop(): Promise<void> {
  // Create an array of 5 runSim promises
  const simPromises = Array(5).fill(null).map(() => 
    runSim({
      maxPosts: 10,
    })
  );

  // Execute all 5 simulations concurrently
  await Promise.all(simPromises);
} 