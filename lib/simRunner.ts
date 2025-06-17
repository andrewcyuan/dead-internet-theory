import { createClient } from "@/lib/supabase/client";
import { createPostSelectionPrompt, createReadingPrompt, createVotingPrompt, readingTools, tools, votingTools } from "./prompts";

export type Post = {
    id?: string;
    score?: number;
    title?: string;
    body: string;
    author: string;
    replying_to?: string;
    type: string;
    created_at?: string;
}

export type Agent = {
    id: string;
    username: string;
    persona: string;
    memory: string;
}

export type SimConditions = {
    maxPosts: number;
}

const selectRandomAgent = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('agent_profiles').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(error);
    }
    // truly select a random agent
    const randomIndex = Math.floor(Math.random() * (data?.length ?? 0));
    const agent = data?.[randomIndex];
    return agent;
}

const getUsername = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('agent_profiles').select('username').eq('id', id).single();
    if (error) {
        console.error(error);
    }
    return data?.username;
}

const getComments = async (postId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('posts').select('*').eq('replying_to', postId).eq('type', 'comment');
    const first_layer = data ? data : [];

    const second_layer = await Promise.all(first_layer.map(async (post) => {
        const { data, error } = await supabase.from('posts').select('*').eq('replying_to', post.id).eq('type', 'comment');
        return data;
    }));

    const all_comments = [...first_layer, ...second_layer];
    if (error) {
        console.error(error);
    }
    return all_comments;
}

const countPosts = async () => {
    // count the number of rows in the posts table
    const supabase = createClient();
    const { data, error } = await supabase.from('posts').select('*', { count: 'exact' });
    if (error) {
        console.error(error);
    }
    return data?.[0]?.count ?? 0;
}

const readPost = async (post: Post, agent: Agent) => {
    const comments = await getComments(post.replying_to ?? '');
    const prompt = createReadingPrompt({ persona: agent.persona, memory: agent.memory, post: post, comments: comments });
    // Call OpenAI API
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: prompt },
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.6,
            tool_choice: 'auto',
            tools: readingTools,
        }),
    });

    const result = await response.json();
    console.log(result);

    let action;
    try {
        action = result.choices[0].message.tool_calls[0].function;
    } catch (error) {
        return;
    }
    if (action.name === 'select_post') {
        const postContent = JSON.parse(action.arguments);
        console.log('postContent', postContent);
        console.log('comments', comments);
        console.log('inserted post', {
            body: postContent.body,
            author: agent.id,
            replying_to: (postContent.target_id === 0 || comments.length === 0) ? post.replying_to : comments[postContent.target_id - 1].id,
            score: 0,
            type: 'comment',
        });
        const supabase = createClient();
        const { data, error } = await supabase.from('posts').insert({
            body: postContent.body,
            author: agent.id,
            replying_to: postContent.target_id === 0 ? post.replying_to : comments[postContent.target_id - 1].id,
            score: 0,
            type: 'comment',
        });
        if (error) {
            console.error(error);
        }
    }
}

const saveToMemory = async (agent: Agent, memory: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('agent_profiles').update({
        memory: agent.memory + "\n" + memory,
    }).eq('username', agent.username);
}

// upvote tool
const votePost = async (postId: string, vote: 'up' | 'down') => {
    const supabase = createClient();
    
    // First get the current post
    const { data: post, error: readError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
    
    if (readError || !post) {
        console.error('Error fetching post:', readError);
        return;
    }

    const increment = vote === 'up' ? 1 : -1;

    // Then update with incremented score
    const { data, error } = await supabase
        .from('posts')
        .update({ score: post.score + increment })
        .eq('id', postId);

    if (error) {
        console.error('Error updating post score:', error);
    }
    return data;
}

const createNewPost = async (post: Post) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();
    if (error) {
        console.error(error);
        return null;
    }
    return data;
}

const generatePrompt = async (agent: Agent) => {
    const supabase = createClient();
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('type', 'post');

    if (error) {
        console.error(error);
        return;
    }
    const postsRandomSubset = posts.sort(() => Math.random() - 0.5).slice(0, 10); // read a random 10 posts (simulate feed)
    console.log(postsRandomSubset);

    // Create the prompt for the agent
    const prompt = createPostSelectionPrompt({
        persona: agent.persona,
        memory: agent.memory,
        posts: postsRandomSubset,
    });

    return [prompt, postsRandomSubset];
}

const interact = async (agent: Agent) => {
    // Get all posts for context (check that type column is 'post')
    const r = await generatePrompt(agent);
    const prompt = r?.[0];
    const posts = r?.[1] as Post[];

    // Call OpenAI API for read / reply
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: prompt },
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.6,
            tools: tools,
            tool_choice: 'required',
        }),
    });

    const result = await response.json();
    console.log(result);
    const action = result.choices[0].message.tool_calls[0].function;

    if (action.name === 'read_post') {
        const postContent = JSON.parse(action.arguments); //target_id, title, body

        console.log("index", postContent.target_id);
        console.log("")

        const post = await readPost({
            body: posts?.[postContent.target_id - 1].body,
            author: agent.id,
            replying_to: posts?.[postContent.target_id - 1].id,
            score: 0,
            type: 'comment',
        }, agent);
    }

    if (action.name === 'create_post') {
        const postContent = JSON.parse(action.arguments); //title, body
        await createNewPost({
            title: postContent.title,
            body: postContent.body,
            author: agent.id,
            type: 'post',
        });
    }

    // choose whether to upvote, downvote, or do nothing for each post
    console.log("Starting voting process for agent:", agent.username);
    const votingPrompt = createVotingPrompt({
        persona: agent.persona,
        memory: agent.memory,
        posts: posts as Post[],
    });

    try {
        console.log("Making voting API call...");
        const votingResponse = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: votingPrompt },   
                ],
                model: 'gpt-3.5-turbo',
                temperature: 0.6,
                tools: votingTools,
                tool_choice: 'required',
            }),
        });

        console.log("Voting API response status:", votingResponse.status);
        
        if (!votingResponse.ok) {
            const errorText = await votingResponse.text();
            console.error("Voting API error:", errorText);
            return null;
        }

        const votingResult = await votingResponse.json();
        console.log("votingResult", votingResult);

        if (votingResult.choices && votingResult.choices[0] && votingResult.choices[0].message && votingResult.choices[0].message.tool_calls) {
            const votingAction = votingResult.choices[0].message.tool_calls[0].function;
            if (votingAction.name === 'vote_post') {
                const votingData = JSON.parse(votingAction.arguments);
                console.log("Parsed voting data:", votingData);
                const votes = votingData.votes; // Extract votes from the correct property
                console.log("Processing votes:", votes);
                for (const vote of votes) {
                    if (vote.action !== 'none') { // Only process actual votes
                        const targetPostId = posts[vote.post_id - 1]?.id;
                        console.log(`Voting ${vote.action} on post ${vote.post_id} (${targetPostId})`);
                        if (targetPostId) {
                            await votePost(targetPostId, vote.action);
                        }
                    }
                }
            }
        } else {
            console.error("Unexpected voting result structure:", votingResult);
        }
    } catch (error) {
        console.error("Error in voting process:", error);
    }

    return null;
}

export const runSim = async (simConditions: SimConditions) => {
    // delete all rows from posts table
    const supabase = createClient();
    await supabase.from('posts').delete().neq('type', 'bruh');

    for (let i = 0; i < simConditions.maxPosts; i++) {
        // randomly select an agent
        const agent = await selectRandomAgent();
        console.log(agent);
        if (!agent) {
            // continue;
        }

        // interact with the agent
        const result = await interact(agent);
    }
}
