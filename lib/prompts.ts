import { Post } from "./simRunner"

interface PromptParams {
    persona: string;
    memory: string;
    posts: Post[];
}

interface ReadingPromptParams {
    persona: string;
    memory: string;
    post: Post;
    comments: Post[];
}

interface VotingParams {
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


        Choose one and only one action based on your persona and memory:
        - create a new post based on your persona and memory
        - read a post you're interested in. Select it with its ID

        if you don't see many posts, you must create a new post with some unique ideas.
        `

    return prompt;
}

export const tools = [
    {
        "type": "function",
        "function": {
            "name": "read_post",
            "description": "Create a new post responding to the post with the target ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_id": {
                        "type": "number",
                        "description": "The ID of the post you are responding to",
                    }
                },
                "required": ["target_id"]
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
                        "description": "The title of the post you are creating",
                    },
                    "body": {
                        "type": "string",
                        "description": "The body of the post you are creating",
                    }
                },
                "required": ["title", "body"]
            }
        }
    }
]

export const createReadingPrompt = ({ persona, memory, post, comments }: ReadingPromptParams): string => {
    let i = 0;
    const commentsString = comments.map(comment => {
        i++;
        return `
        ${i}. ${comment.body}
        ID: ${i}
        `
    }).join('\n\n');
    const prompt = `
        You are an agent with this persona: ${persona}
        
        and this memory: ${memory}.

        You've decided to read the following post:
        ${post.body}

        with the following comments:
        ${commentsString}

        If you'd like to respond to a comment or the main post, select it with its ID.
        `
    console.log(prompt);
    return prompt
}

export const readingTools = [
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
                    },
                    "body": {
                        "type": "string",
                        "description": "The body of the post you are creating",
                    }
                },
                "required": ["target_id", "body"]
            }
        }
    }
]

export const createVotingPrompt = ({ persona, memory, posts }: VotingParams): string => {
    let i = 0;
    const postsString = posts.map(post => {
        i++;
        return `
        ${i}. ${post.title}
        Content: ${post.body}
        By: ${post.author}
        Score: ${post.score}
        ID: ${i}
        ---
        `
    }).join('\n\n');

    const prompt = `
        You are an agent with this persona: ${persona}
        
        and this memory: ${memory}.

        You've decided to vote on the following posts:
        ${postsString}

        For each post, choose one and only one action based on your persona and memory:
        - upvote the post (action: "up")
        - downvote the post (action: "down")
        - do nothing (action: "none")

        Return the actions you've chosen for each post as an array of objects in this form:
        [
            {
                "post_id": 1,
                "action": "up"
            }
        ]
    `

    return prompt;
}

export const votingTools = [
    {
        "type": "function",
        "function": {
            "name": "vote_post",
            "description": "Vote on the post with the target ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "votes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "post_id": {
                                    "type": "number",
                                    "description": "The ID of the post you are responding to",
                                },
                                "action": {
                                    "type": "string",
                                    "description": "The action you are taking",
                                }
                            },
                            "required": ["post_id", "action"]
                        }
                    }
                },
                "required": ["votes"]
            }
        }
    }
]