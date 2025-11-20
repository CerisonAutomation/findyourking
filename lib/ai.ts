// Simplified AI functions for Vercel integration
// TODO: Implement with proper AI SDK when dependencies are resolved

// AI Gateway for automatic failover and routing
export const aiGateway = {
  primary: 'openai',
  fallback: 'openai',
  emergency: 'openai',
};

// AI Boyfriend response generation
export async function generateBoyfriendResponse(
  boyfriend: { name: string; personality: { openness: number; conscientiousness: number; extraversion: number; agreeableness: number; neuroticism: number }; bio?: string },
  userMessage: string
) {
  // Mock response for now
  const responses = [
    `Hey there! I love that you're sharing that with me. ${userMessage.length > 50 ? 'That sounds really interesting!' : 'Tell me more about that.'}`,
    `That's fascinating! I'm really enjoying getting to know you better. What made you think of that?`,
    `I appreciate you opening up to me like that. It means a lot. How are you feeling about everything?`,
    `Wow, that's really cool! I haven't thought about it that way before. What's your take on it?`,
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return {
    response: randomResponse,
    toolCalls: [],
    usage: { tokens: 150 },
  };
}

// Streaming response for real-time chat
export async function streamBoyfriendResponse(
  boyfriend: { name: string; personality: { openness: number; conscientiousness: number; extraversion: number; agreeableness: number; neuroticism: number }; bio?: string },
  userMessage: string
) {
  // Mock streaming response
  const response = await generateBoyfriendResponse(boyfriend, userMessage);
  return {
    [Symbol.asyncIterator]: async function* () {
      const words = response.response.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };
}

// Content moderation using AI
export async function moderateContent(content: string): Promise<{
  isAppropriate: boolean;
  reason?: string;
  confidence: number;
}> {
  // Simple mock moderation
  const inappropriateWords = ['inappropriate', 'badword', 'offensive'];
  const hasInappropriate = inappropriateWords.some(word =>
    content.toLowerCase().includes(word)
  );

  return {
    isAppropriate: !hasInappropriate,
    reason: hasInappropriate ? 'Contains potentially inappropriate content' : undefined,
    confidence: 0.8,
  };
}