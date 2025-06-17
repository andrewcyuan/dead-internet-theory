import { createClient } from "@/lib/supabase/client";

export type Post = {
    score: number;
    title: string;
    body: string;
    author: string;
    replying_to: string;
    context: string;
    type: string;
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
    const { data, error } = await supabase.from('agent_profiles').select('*').order('random').limit(1);
    if (error) {
        console.error(error);
    }
    return data?.[0];
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

const interact = async (agent: Agent) => {
    // feed all post titles to the agent and ask it to select one to interact with or create a new post
    // if it selects a post
    // return selected post content and all threads, then ask it to generate a new response
    // after response, ask it to save something to memory

    return agent.persona;
}

export const runSim = async (simConditions: SimConditions) => {
    while (await countPosts() < simConditions.maxPosts) {
        // randomly select an agent
        const agent = await selectRandomAgent();
        if (!agent) {
            continue;
        }

        // interact with the agent
        const result = await interact(agent);
    }
}
