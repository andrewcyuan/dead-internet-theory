"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'what', 'who', 'why', 'how',
  'not', 'no', 'yes', 'so', 'too', 'very', 'much', 'many', 'more', 'most', 'less', 'least',
  'some', 'any', 'all', 'each', 'every', 'both', 'either', 'neither', 'one', 'two', 'first', 'last',
  'about', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'as', 'if', 'because', 'since', 'until', 'while', 'although', 'though', 'however', 'therefore',
  'just', 'only', 'also', 'still', 'yet', 'even', 'now', 'then', 'well', 'quite', 'rather'
]);

export function WordFrequencyChart() {
  const [wordFrequencies, setWordFrequencies] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWordData = async () => {
      try {
        const supabase = createClient();
        
        // Get all posts and comments with their text content
        const { data: posts, error } = await supabase
          .from('posts')
          .select('title, body');

        if (error) {
          console.error('Error fetching word data:', error);
          return;
        }

        // Extract and count words
        const wordCounts = new Map<string, number>();
        
        posts?.forEach(post => {
          const text = `${post.title || ''} ${post.body || ''}`.toLowerCase();
          // Extract words using regex, removing punctuation
          const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
          
          words.forEach(word => {
            if (!COMMON_WORDS.has(word) && word.length >= 3) {
              wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            }
          });
        });

        // Convert to array and sort by frequency
        const sortedWords = Array.from(wordCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15); // Top 15 words

        // Calculate percentages based on the most frequent word
        const maxCount = sortedWords[0]?.[1] || 1;
        const frequencies = sortedWords.map(([word, count]) => ({
          word,
          count,
          percentage: (count / maxCount) * 100
        }));

        setWordFrequencies(frequencies);
      } catch (error) {
        console.error('Error calculating word frequencies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWordData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchWordData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="h-80">
        <CardHeader>
          <h3 className="text-lg font-semibold">Word Frequency</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-80 overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Word Frequency</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {wordFrequencies.map((item, index) => (
              <div key={item.word} className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-gray-600 text-right">
                  {item.word}
                </div>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="w-8 text-xs text-gray-500 text-right">
                  {item.count}
                </div>
              </div>
            ))}
            {wordFrequencies.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No word data available yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 