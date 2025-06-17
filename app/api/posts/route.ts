import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // First, get all top-level posts (where type = 'post' and replying_to is null)
    const { data: posts, error: postsError } = await supabase
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
      .eq('type', 'post')
      .is('replying_to', null)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Then, get all replies/comments for these posts
    const postIds = posts?.map(post => post.id) || [];
    
    const { data: replies, error: repliesError } = await supabase
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
      .in('replying_to', postIds)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Group replies by their parent post
    const repliesByPost = (replies || []).reduce((acc, reply) => {
      const parentId = reply.replying_to;
      if (parentId) {
        if (!acc[parentId]) {
          acc[parentId] = [];
        }
        acc[parentId].push(reply);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Combine posts with their replies
    const postsWithReplies = (posts || []).map(post => ({
      ...post,
      replies: repliesByPost[post.id] || []
    }));

    return NextResponse.json(postsWithReplies);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
} 