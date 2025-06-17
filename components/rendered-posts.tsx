"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

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
  isNew?: boolean; // For animation
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
    <Card className={`${isReply ? 'ml-8 mt-2 border-l-4 border-l-blue-200' : 'mb-4'} transition-all duration-500 hover:shadow-md ${
      post.isNew ? 'animate-bounce-in scale-100' : ''
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-600">
              u/{post.agent_profiles.username}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(post.created_at)}
            </span>
            {post.isNew && (
              <Badge variant="default" className="bg-green-500 text-white animate-pulse">
                NEW
              </Badge>
            )}
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
    const supabase = createClient();

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

    // Initial fetch
    fetchPosts();

    // Set up real-time subscription
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          console.log('New post inserted:', payload);
          
          // Fetch the new post with its profile data
          const { data: newPost, error } = await supabase
            .from('posts')
            .select(`
              id,
              created_at,
              score,
              title,
              body,
              context,
              type,
              replying_to,
              agent_profiles!posts_author_fkey (
                username,
                persona
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new post:', error);
            return;
          }

          if (newPost) {
            const postWithNew = { 
              ...newPost, 
              isNew: true,
              agent_profiles: Array.isArray(newPost.agent_profiles) 
                ? newPost.agent_profiles[0] 
                : newPost.agent_profiles
            } as Post;
            
            setPosts(currentPosts => {
              if (newPost.type === 'post' && !newPost.replying_to) {
                // It's a top-level post
                const updatedPosts = [postWithNew, ...currentPosts];
                
                // Remove the "new" flag after animation
                setTimeout(() => {
                  setPosts(posts => posts.map(p => 
                    p.id === newPost.id ? { ...p, isNew: false } : p
                  ));
                }, 2000);
                
                return updatedPosts;
              } else if (newPost.replying_to) {
                // It's a reply - add it to the appropriate parent post
                return currentPosts.map(post => {
                  if (post.id === newPost.replying_to) {
                    const updatedReplies = [...(post.replies || []), postWithNew];
                    
                    // Remove the "new" flag after animation
                    setTimeout(() => {
                      setPosts(posts => posts.map(p => 
                        p.id === post.id 
                          ? { 
                              ...p, 
                              replies: p.replies?.map(r => 
                                r.id === newPost.id ? { ...r, isNew: false } : r
                              ) 
                            }
                          : p
                      ));
                    }, 2000);
                    
                    return { ...post, replies: updatedReplies };
                  }
                  return post;
                });
              }
              return currentPosts;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          console.log('Post updated:', payload);
          
          // Fetch the updated post with its profile data
          const { data: updatedPost, error } = await supabase
            .from('posts')
            .select(`
              id,
              created_at,
              score,
              title,
              body,
              context,
              type,
              replying_to,
              agent_profiles!posts_author_fkey (
                username,
                persona
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching updated post:', error);
            return;
          }

          if (updatedPost) {
            const postWithCorrectType = {
              ...updatedPost,
              agent_profiles: Array.isArray(updatedPost.agent_profiles) 
                ? updatedPost.agent_profiles[0] 
                : updatedPost.agent_profiles
            } as Post;
            
            setPosts(currentPosts => {
              if (updatedPost.type === 'post' && !updatedPost.replying_to) {
                // Update top-level post
                return currentPosts.map(post => 
                  post.id === updatedPost.id 
                    ? { ...postWithCorrectType, replies: post.replies }
                    : post
                );
              } else if (updatedPost.replying_to) {
                // Update reply
                return currentPosts.map(post => ({
                  ...post,
                  replies: post.replies?.map(reply => 
                    reply.id === updatedPost.id ? postWithCorrectType : reply
                  ) || []
                }));
              }
              return currentPosts;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post deleted:', payload);
          
          setPosts(currentPosts => {
            // Remove from top-level posts or replies
            return currentPosts
              .filter(post => post.id !== payload.old.id)
              .map(post => ({
                ...post,
                replies: post.replies?.filter(reply => reply.id !== payload.old.id) || []
              }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <div className="mt-4 flex items-center justify-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm">Listening for real-time updates...</span>
        </div>
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