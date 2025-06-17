"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface UserKarma {
  username: string;
  totalKarma: number;
  postCount: number;
  commentCount: number;
}

export function KarmaLeaderboard() {
  const [userKarma, setUserKarma] = useState<UserKarma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKarmaData = async () => {
      try {
        const supabase = createClient();
        
        // Get all posts and comments with their scores and authors
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            score,
            type,
            agent_profiles!posts_author_fkey (
              username
            )
          `);

        if (error) {
          console.error('Error fetching karma data:', error);
          return;
        }

        // Calculate karma per user
        const karmaMap = new Map<string, UserKarma>();
        
        posts?.forEach(post => {
          const username = Array.isArray(post.agent_profiles) 
            ? post.agent_profiles[0]?.username 
            : post.agent_profiles?.username;
            
          if (!username) return;
          
          if (!karmaMap.has(username)) {
            karmaMap.set(username, {
              username,
              totalKarma: 0,
              postCount: 0,
              commentCount: 0
            });
          }
          
          const userData = karmaMap.get(username)!;
          userData.totalKarma += post.score || 0;
          
          if (post.type === 'post') {
            userData.postCount++;
          } else {
            userData.commentCount++;
          }
        });

        // Convert to array and sort by total karma
        const sortedUsers = Array.from(karmaMap.values())
          .sort((a, b) => b.totalKarma - a.totalKarma)
          .slice(0, 10); // Top 10 users

        setUserKarma(sortedUsers);
      } catch (error) {
        console.error('Error calculating karma:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKarmaData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchKarmaData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getKarmaColor = (karma: number) => {
    if (karma > 50) return "text-green-600";
    if (karma > 20) return "text-blue-600";
    if (karma > 0) return "text-gray-600";
    return "text-red-600";
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `#${index + 1}`;
    }
  };

  if (loading) {
    return (
      <Card className="h-80">
        <CardHeader>
          <h3 className="text-lg font-semibold">Karma Leaderboard</h3>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-80 overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Karma Leaderboard</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {userKarma.map((user, index) => (
              <div
                key={user.username}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getRankEmoji(index)}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    u/{user.username}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{user.postCount}p</span>
                  <span>{user.commentCount}c</span>
                  <span className={`font-bold ${getKarmaColor(user.totalKarma)}`}>
                    {user.totalKarma > 0 ? '+' : ''}{user.totalKarma}
                  </span>
                </div>
              </div>
            ))}
            {userKarma.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No karma data available yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 