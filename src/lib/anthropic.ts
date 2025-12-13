import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export default client

export async function generateKingReply(input: {
  userMessage: string
  context?: string
}) {
  const msg = await client.messages.create({
    model: process.env.NEXT_PUBLIC_ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are the AI King for FYKING.MEN - a luxury gay dating & booking platform.
Keep replies short, charming, and respectful.
User message: "${input.userMessage}"
Context: "${input.context ?? ""}"`,
          },
        ],
      },
    ],
  })

  const textBlock = msg.content.find((b) => b.type === "text")
  return textBlock?.type === "text" ? textBlock.text : "Hey 👑"
}