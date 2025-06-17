import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      messages: body.messages,
      model: body.model || 'gpt-3.5-turbo',
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens,
      stream: body.stream || false,
      tools: body.tools || [],
      tool_choice: body.tool_choice,
    });

    return NextResponse.json(completion);
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
} 