import { createClient } from "@/lib/supabase/client";
import { createPostSelectionPrompt, createReadingPrompt, readingTools, tools } from "./prompts";

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
    console.log(agent);
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

const replyToPost = async (post: Post, agent: Agent) => {

    // Call OpenAI API
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: createReadingPrompt({ persona: agent.persona, memory: agent.memory, post: post, comments: await getComments(post.id ?? '') }) },
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.6,
            tool_choice: 'required',
            tools: readingTools,
        }),
    });

    const result = await response.json();
    console.log(result);

    const action = result.choices[0].message.tool_calls[0].function;
    if (action.name === 'select_post') {
        const postContent = JSON.parse(action.arguments);
        const supabase = createClient();
        const { data, error } = await supabase.from('posts').insert({
            body: postContent.body,
            author: agent.id,
            replying_to: postContent.target_id,
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

const upvotePost = async (postId: string) => {
    const supabase = createClient();
    const { data: post, error: postError } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (postError) {
        console.error(postError);
    }
    const { data, error } = await supabase.from('posts').update({
        score: post.score + 1,
    }).eq('id', postId);
    if (error) {
        console.error(error);
    }
}

const downvotePost = async (postId: string) => {
    const supabase = createClient();
    const { data: post, error: postError } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (postError) {
        console.error(postError);
    }
    const { data, error } = await supabase.from('posts').update({
        score: post.score - 1,
    }).eq('id', postId);
    if (error) {
        console.error(error);
    }
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
            temperature: 0.6,
            tools: tools,
            tool_choice: 'required',
        }),
    });

    const result = await response.json();
    console.log(result);
    const action = result.choices[0].message.tool_calls[0].function;

    if (action.name === 'select_post') {
        const postContent = JSON.parse(action.arguments); //target_id, title, body

        console.log("index", postContent.target_id);
        console.log("")

        const post = await replyToPost({
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

    if (action.name === 'upvote') {
        const postId = JSON.parse(action.arguments);
        const post = await upvotePost(postId);
    }

    if (action.name === 'downvote') {
        const postId = JSON.parse(action.arguments);
        const post = await downvotePost(postId);
    }

    return null;
}

export const runSim = async (simConditions: SimConditions) => {
    // delete all rows from posts table if type is comment
    const supabase = createClient();
    const { data, error } = await supabase.from('posts').delete().eq('type', 'comment');
    if (error) {
        console.error(error);
    }

    for (let i = 0; i < 10; i++) {
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
