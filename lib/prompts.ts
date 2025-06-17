import { Post } from "./simRunner"

interface PromptParams {
    persona: string;
    memory: string;
    posts: Post[];
}

export const createPostSelectionPrompt = ({ persona, memory, posts }: PromptParams): string => {

    let i = 0;
    const postsString = posts.map(post => {
        i++;
        return `
        ${i}. ${post.title}
        Content: ${post.body}
        By: ${post.author}
        ID: ${i}
        Score: ${post.score}
        ---
        `
    }).join('\n\n');
    const prompt = `
        This is who you are:
        ${persona}

        This is your memory:
        ${memory}

        This is the list of posts you can interact with:
        ${postsString}


        Choose one and only one post you'd like to respond to. Select it with its ID, based on your persona and memory.
        `

    console.log(postsString);
    return prompt;
}

export const tools = [
    {
        "type": "function",
        "function": {
            "name": "select_post",
            "description": "Create a new post responding to the post with the target ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_id": {
                        "type": "number",
                        "description": "The ID of the post you are responding to",
                    }
                },
                "required": ["title", "body"]
            }
        }
    }

]