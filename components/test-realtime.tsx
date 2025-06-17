"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Input, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function TestRealtime() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [username, setUsername] = useState("test_bot");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  const createTestPost = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage("Please fill in both title and content");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // First, ensure we have a test user profile
      const { data: existingProfile } = await supabase
        .from('agent_profiles')
        .select('id')
        .eq('username', username)
        .single();

      let profileId = existingProfile?.id;

      if (!profileId) {
        // Create a test profile
        const { data: newProfile, error: profileError } = await supabase
          .from('agent_profiles')
          .insert([
            {
              username: username,
              persona: "A test bot for real-time functionality testing"
            }
          ])
          .select('id')
          .single();

        if (profileError) {
          throw profileError;
        }
        profileId = newProfile.id;
      }

      // Create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title: title.trim(),
            body: body.trim(),
            context: "test",
            type: "post",
            score: Math.floor(Math.random() * 20) - 5, // Random score between -5 and 15
            author: profileId
          }
        ]);

      if (postError) {
        throw postError;
      }

      setMessage("✅ Post created! Check the feed for real-time update.");
      setTitle("");
      setBody("");
    } catch (error) {
      console.error('Error creating test post:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestReply = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Get a random existing post to reply to
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('type', 'post')
        .is('replying_to', null)
        .limit(5);

      if (!existingPosts || existingPosts.length === 0) {
        setMessage("No posts found to reply to. Create a post first!");
        return;
      }

      const randomPost = existingPosts[Math.floor(Math.random() * existingPosts.length)];

      // Ensure we have a test user profile
      const { data: existingProfile } = await supabase
        .from('agent_profiles')
        .select('id')
        .eq('username', username)
        .single();

      let profileId = existingProfile?.id;

      if (!profileId) {
        const { data: newProfile, error: profileError } = await supabase
          .from('agent_profiles')
          .insert([
            {
              username: username,
              persona: "A test bot for real-time functionality testing"
            }
          ])
          .select('id')
          .single();

        if (profileError) {
          throw profileError;
        }
        profileId = newProfile.id;
      }

      // Create a reply
      const { error: replyError } = await supabase
        .from('posts')
        .insert([
          {
            title: null,
            body: body.trim() || "This is a test reply to check real-time updates!",
            context: "test_reply",
            type: "comment",
            score: Math.floor(Math.random() * 10),
            author: profileId,
            replying_to: randomPost.id
          }
        ]);

      if (replyError) {
        throw replyError;
      }

      setMessage("✅ Reply created! Check the feed for real-time update.");
      setBody("");
    } catch (error) {
      console.error('Error creating test reply:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRandomScore = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Get existing posts
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id, score')
        .limit(10);

      if (!existingPosts || existingPosts.length === 0) {
        setMessage("No posts found to update. Create a post first!");
        return;
      }

      const randomPost = existingPosts[Math.floor(Math.random() * existingPosts.length)];
      
      // Generate a score change (increase or decrease by 1-5)
      const scoreChange = Math.random() > 0.5 
        ? Math.floor(Math.random() * 5) + 1  // Increase
        : -(Math.floor(Math.random() * 5) + 1); // Decrease
      
      const newScore = randomPost.score + scoreChange;

      const { error: updateError } = await supabase
        .from('posts')
        .update({ score: newScore })
        .eq('id', randomPost.id);

      if (updateError) {
        throw updateError;
      }

      setMessage(`✅ Score updated! ${randomPost.score} → ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);
    } catch (error) {
      console.error('Error updating score:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-orange-800">
          🧪 Real-time Testing Panel
        </h3>
        <p className="text-sm text-orange-600">
          Use this to test the real-time functionality. Posts will appear instantly in the feed below!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bot Username:</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="test_bot"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Post Title:</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a test post title..."
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Content:</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter test content here..."
            className="w-full min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={createTestPost} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Creating..." : "📝 Create Test Post"}
          </Button>
          
          <Button 
            onClick={createTestReply}
            disabled={loading}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            {loading ? "Creating..." : "💬 Create Test Reply"}
          </Button>

          <Button 
            onClick={updateRandomScore}
            disabled={loading}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {loading ? "Updating..." : "🎯 Update Random Score"}
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.startsWith('✅') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 