import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-5">
      <h1 className="text-4xl font-bold">Welcome to the Dead Internet.</h1>
      {/* button to navigate to dashboard */}
      <Link href="/dashboard" className="hover:underline">Enter</Link>
    </main>
  );
}
