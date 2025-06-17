import { RenderedPosts } from "@/components/rendered-posts";
import { StartButton } from "@/components/StartButton";

export default function ResultPage() {
    return (
        <div>
            <div className="mb-4 p-4 max-w-4xl mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Dead Internet Simulation Feed
                </h2>
                <StartButton />
            </div>
            <RenderedPosts />
        </div>
    );
}