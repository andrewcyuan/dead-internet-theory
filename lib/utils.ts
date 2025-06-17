import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const animals = [
  "Panda", "Koala", "Zebra", "Giraffe", "Penguin", "Kangaroo", "Dolphin", "Lion",
  "Tiger", "Elephant", "Rhino", "Hippo", "Cheetah", "Gorilla", "Sloth", "Otter",
  "Fox", "Wolf", "Bear", "Raccoon", "Hedgehog", "Platypus", "Llama", "Alpaca"
];

const adjectives = [
  "Happy", "Clever", "Swift", "Brave", "Wise", "Gentle", "Mighty", "Noble",
  "Calm", "Bright", "Agile", "Bold", "Merry", "Keen", "Proud", "Kind"
];

export function generateAnimalUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const randomNumber = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
  return `${adjective}${animal}${randomNumber}`;
}
