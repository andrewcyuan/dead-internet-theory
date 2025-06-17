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


        Choose one and only one post, and respond to it.
        `
    return prompt;
}

export const tools = [
    {
        "type": "function",
        "function": {
            "name": "create_post",
            "description": "Create a new post responding to the post with the target ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_id": {
                        "type": "number",
                        "description": "The ID of the post you are responding to",
                    },
                    "body": {
                        "type": "string",
                        "description": "The body of the post"
                    }
                },
                "required": ["title", "body"]
            }
        }
    }

]