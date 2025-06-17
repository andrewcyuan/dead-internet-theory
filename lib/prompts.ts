interface PromptParams {
    persona: string;
    memory: string;
    posts: string;
}

export const createPostSelectionPrompt = ({ persona, memory, posts }: PromptParams): string => `
This is who you are:
${persona}

This is your memory:
${memory}

This is the list of posts you can interact with:
${posts}


Choose one and only one of the following actions:
- select a post, you will be able to read the post and all threads.
- create a new post, you will be able to create a new post with title and content.
`

export const tools = [
    {
        "type": "function",
        "function": {
            "name": "read_post",
            "description": "Read a post",
            "parameters": {
                "type": "object",
                "properties": {
                    "post_id": {
                        "type": "string",
                        "description": "The ID of the post to read"
                    },
                },
                "required": ["post_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_post",
            "description": "Create a new post",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the post"
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