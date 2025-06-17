import { createClient } from "@/lib/supabase/client";
import { createPostSelectionPrompt, tools } from "./prompts";

export type Post = {
    id?: string;
    score: number;
    title?: string;
    body: string;
    author: string;
    replying_to: string;
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
    const { data, error } = await supabase.from('agent_profiles').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) {
        console.error(error);
    }
    return data?.[0];
}

const getUsername = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('agent_profiles').select('username').eq('id', id).single();
    if (error) {
        console.error(error);
    }
    return data?.username;
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

const createPost = async (post: Post) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('posts').insert(post);
    if (error) {
        console.error(error);
    }
}

const saveToMemory = async (agent: Agent, memory: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('agent_profiles').update({
        memory: agent.memory + "\n" + memory,
    }).eq('username', agent.username);
}

const readPost = async (postId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
    if (error) {
        console.error(error);
        return null;
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
    const posts = r?.[1];

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
            temperature: 0.7,
            tools: tools,
        }),
    });

    const result = await response.json();
    console.log(result);
    const action = result.choices[0].message.tool_calls[0].function;

    if (action.name === 'create_post') {
        const postContent = JSON.parse(action.arguments); //given_post_id, title, body
        const post = await createPost({
            body: postContent.body,
            author: agent.id,
            replying_to: posts?.[postContent.target_id - 1].id,
            score: 0,
            type: 'comment',
        });
    }

    return null;
}

export const runSim = async (simConditions: SimConditions) => {
    // while (await countPosts() < simConditions.maxPosts) {
    // randomly select an agent
    const agent = await selectRandomAgent();
    console.log(agent);
    if (!agent) {
        // continue;
    }

    // interact with the agent
    const result = await interact(agent);
    // }
}
