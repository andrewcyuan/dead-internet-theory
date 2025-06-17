import { runSim } from "./simRunner";

export function controlLoop(): void {
  runSim({
    maxPosts: 10,
  });
} 