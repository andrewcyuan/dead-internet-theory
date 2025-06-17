import { createClient } from "@/lib/supabase/client";
import { createPostSelectionPrompt, tools } from "./prompts";

export type Post = {
    id?: string;
    score: number;
    title: string;
    body: string;
    author: string;
    replying_to: string;
    context: string;
    type: string;
    created_at?: string;
}

export type Agent = {
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
        .eq('type', 'post')
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.log(posts);

    // Format posts into a string
    const postsString = (await Promise.all(posts.map(async post => `${post.title}\nBy: ${await getUsername(post.author)}\nID: ${post.id}\n---`)))
        .join('\n\n');

    // Create the prompt for the agent
    const prompt = createPostSelectionPrompt({
        persona: agent.persona,
        memory: agent.memory,
        posts: postsString,
    });

    return prompt;
}

const interact = async (agent: Agent) => {
    // Get all posts for context (check that type column is 'post')
    const prompt = await generatePrompt(agent);

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

    if (action.name === 'read_post') {
        const postId = action.arguments.post_id;
        const post = await readPost(postId);
    }

    if (action.name === 'create_post') {
        const postContent = action.arguments.post_content;
        const [title, ...bodyParts] = postContent.split('\n');
        const body = bodyParts.join('\n');
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
