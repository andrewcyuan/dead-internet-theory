import { createClient } from "@/lib/supabase/client";

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

const interact = async (agent: Agent) => {
    const supabase = createClient();
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
