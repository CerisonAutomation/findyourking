import { ChatLoadingSkeleton } from "@/components/loading-skeletons";

/**
 * CHAT LOADING STATE - STREAMING SKELETON
 * Per Next.js loading docs: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * 
 * Renders while chat page is being fetched.
 * High-fidelity skeleton mimics the actual chat UI for smooth transition.
 */

export default function ChatLoading() {
  return <ChatLoadingSkeleton />;
}
