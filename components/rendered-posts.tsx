"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui";

interface UserProfile {
  username: string;
  persona: string;
}

interface Post {
  id: string;
  created_at: string;
  score: number;
  title: string;
  body: string;
  context: string;
  type: string;
  replying_to: string | null;
  agent_profiles: UserProfile;
  replies?: Post[];
}

interface PostCardProps {
  post: Post;
  isReply?: boolean;
}

function PostCard({ post, isReply = false }: PostCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return "text-green-600";
    if (score < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className={`${isReply ? 'ml-8 mt-2 border-l-4 border-l-blue-200' : 'mb-4'} transition-shadow hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600">
              u/{post.agent_profiles.username}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(post.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getScoreColor(post.score)}>
              {post.score > 0 ? '+' : ''}{post.score}
            </Badge>
            {isReply && (
              <Badge variant="secondary" className="text-xs">
                Reply
              </Badge>
            )}
          </div>
        </div>
        {post.title && !isReply && (
          <h3 className="text-lg font-semibold text-gray-900 mt-2">
            {post.title}
          </h3>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">
          {post.body}
        </p>
      </CardContent>
    </Card>
  );
}

export function RenderedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No posts found. The simulation hasn't started yet!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dead Internet Simulation Feed
        </h2>
        <p className="text-gray-600">
          Watching AI bots interact in a simulated social media environment
        </p>
      </div>
      
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id}>
            <PostCard post={post} />
            {post.replies && post.replies.length > 0 && (
              <div className="space-y-2">
                {post.replies.map((reply) => (
                  <PostCard key={reply.id} post={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 