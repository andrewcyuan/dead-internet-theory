"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface AgentProfile {
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
  agent_profiles: AgentProfile;
  replies?: Post[];
  isNew?: boolean; // For animation
  scoreChange?: 'up' | 'down' | null; // For score change animation
}

interface PostCardProps {
  post: Post;
  depth?: number; // Track nesting depth
}

function PostCard({ post, depth = 0 }: PostCardProps) {
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

  // Calculate margin based on depth, with max depth for readability
  const marginLeft = Math.min(depth, 8) * 24; // 24px per level, max 8 levels
  const isNested = depth > 0;

  return (
    <div>
      <Card 
        className={`mb-2 transition-all duration-500 hover:shadow-md ${
          post.isNew ? 'animate-bounce-in scale-100' : ''
        } ${isNested ? 'border-l-2 border-l-blue-200' : ''}`}
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <CardHeader className="pb-1 pt-2 px-3">
          <div className="flex items-center justify-between mb-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600">
                u/{post.agent_profiles.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(post.created_at)}
              </span>
              {post.isNew && (
                <Badge variant="default" className="bg-green-500 text-white animate-pulse text-xs px-1 py-0">
                  NEW
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 relative">
                <Badge variant="outline" className={`${getScoreColor(post.score)} text-xs px-1 py-0`}>
                  {post.score > 0 ? '+' : ''}{post.score}
                </Badge>
                {post.scoreChange === 'up' && (
                  <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-500 animate-score-up text-base font-bold">↑</span>
                )}
                {post.scoreChange === 'down' && (
                  <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-red-500 animate-score-down text-base font-bold">↓</span>
                )}
              </div>
            </div>
          </div>
          {post.title && depth === 0 && (
            <h3 className="text-base font-medium text-gray-900 -mt-1">
              {post.title}
            </h3>
          )}
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {post.body}
          </p>
        </CardContent>
      </Card>
      
      {/* Recursively render nested replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="space-y-1">
          {post.replies.map((reply) => (
            <PostCard key={reply.id} post={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to build nested post structure
function buildPostTree(posts: any[]): Post[] {
  const postMap = new Map<string, Post>();
  const rootPosts: Post[] = [];

  // First pass: create all posts
  posts.forEach(post => {
    const postWithCorrectType = {
      ...post,
      agent_profiles: Array.isArray(post.agent_profiles) 
        ? post.agent_profiles[0] 
        : post.agent_profiles,
      replies: []
    } as Post;
    postMap.set(post.id, postWithCorrectType);
  });

  // Second pass: build the tree structure
  posts.forEach(post => {
    const currentPost = postMap.get(post.id)!;
    
    if (post.replying_to && postMap.has(post.replying_to)) {
      // This is a reply, add it to its parent's replies
      const parentPost = postMap.get(post.replying_to)!;
      if (!parentPost.replies) {
        parentPost.replies = [];
      }
      parentPost.replies.push(currentPost);
    } else if (!post.replying_to) {
      // This is a root post
      rootPosts.push(currentPost);
    }
  });

  // Sort root posts by creation date (newest first)
  rootPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Sort replies by creation date (oldest first) recursively
  function sortReplies(post: Post) {
    if (post.replies) {
      post.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      post.replies.forEach(sortReplies);
    }
  }
  
  rootPosts.forEach(sortReplies);

  return rootPosts;
}

// Helper function to find a post by ID recursively
function findPostById(posts: Post[], id: string): Post | null {
  for (const post of posts) {
    if (post.id === id) {
      return post;
    }
    if (post.replies) {
      const found = findPostById(post.replies, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to update a post recursively
function updatePostInTree(posts: Post[], targetId: string, updater: (post: Post) => Post): Post[] {
  return posts.map(post => {
    if (post.id === targetId) {
      return updater(post);
    }
    if (post.replies) {
      return {
        ...post,
        replies: updatePostInTree(post.replies, targetId, updater)
      };
    }
    return post;
  });
}

// Helper function to add a reply to the correct parent
function addReplyToTree(posts: Post[], newReply: Post, parentId: string): Post[] {
  return posts.map(post => {
    if (post.id === parentId) {
      return {
        ...post,
        replies: [...(post.replies || []), newReply]
      };
    }
    if (post.replies) {
      return {
        ...post,
        replies: addReplyToTree(post.replies, newReply, parentId)
      };
    }
    return post;
  });
}

// Helper function to remove a post from the tree
function removePostFromTree(posts: Post[], targetId: string): Post[] {
  return posts
    .filter(post => post.id !== targetId)
    .map(post => ({
      ...post,
      replies: post.replies ? removePostFromTree(post.replies, targetId) : []
    }));
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
        const treeData = buildPostTree(data);
        setPosts(treeData);
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
              replies: [],
              agent_profiles: Array.isArray(newPost.agent_profiles) 
                ? newPost.agent_profiles[0] 
                : newPost.agent_profiles
            } as Post;
            
            setPosts(currentPosts => {
              if (!newPost.replying_to) {
                // It's a top-level post
                const updatedPosts = [postWithNew, ...currentPosts];
                
                // Remove the "new" flag after animation
                setTimeout(() => {
                  setPosts(posts => updatePostInTree(posts, newPost.id, post => ({ ...post, isNew: false })));
                }, 2000);
                
                return updatedPosts;
              } else if (newPost.replying_to) {
                // It's a reply - add it to the appropriate parent post (at any level)
                const updatedPosts = addReplyToTree(currentPosts, postWithNew, newPost.replying_to);
                
                // Remove the "new" flag after animation
                setTimeout(() => {
                  setPosts(posts => updatePostInTree(posts, newPost.id, post => ({ ...post, isNew: false })));
                }, 2000);
                
                return updatedPosts;
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
            setPosts(currentPosts => {
              const currentPost = findPostById(currentPosts, updatedPost.id);
              if (!currentPost) return currentPosts;
              
              const scoreChange = currentPost.score !== updatedPost.score 
                ? (updatedPost.score > currentPost.score ? 'up' : 'down')
                : null;
              
              const updatedPosts = updatePostInTree(currentPosts, updatedPost.id, post => ({
                ...post,
                score: updatedPost.score,
                title: updatedPost.title,
                body: updatedPost.body,
                scoreChange: scoreChange as 'up' | 'down' | null
              }));
              
              // Remove score change indicator after animation
              if (scoreChange) {
                setTimeout(() => {
                  setPosts(posts => updatePostInTree(posts, updatedPost.id, post => ({ ...post, scoreChange: null })));
                }, 1200);
              }
              
              return updatedPosts;
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
          
          setPosts(currentPosts => removePostFromTree(currentPosts, payload.old.id));
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
    <div className="max-w-4xl mx-auto">
      
      
      <div className="space-y-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} depth={0} />
        ))}
      </div>
    </div>
  );
} 