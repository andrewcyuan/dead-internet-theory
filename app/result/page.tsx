import { RenderedPosts } from "@/components/rendered-posts";
import { StartButton } from "@/components/StartButton";
import { KarmaLeaderboard } from "@/components/KarmaLeaderboard";
import { WordFrequencyChart } from "@/components/WordFrequencyChart";

export default function ResultPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Dead Internet Simulation Feed
                    </h2>
                    <StartButton />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Half - Posts */}
                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold mb-4">Live Feed</h3>
                            <RenderedPosts />
                        </div>
                    </div>

                    {/* Right Half - Analytics */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Top Right - Karma Leaderboard */}
                        <div>
                            <KarmaLeaderboard />
                        </div>

                        {/* Bottom Right - Word Frequency Chart */}
                        <div>
                            <WordFrequencyChart />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}