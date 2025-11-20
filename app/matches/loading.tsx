import { MatchesLoadingSkeleton } from "@/components/loading-skeletons";

/**
 * MATCHES DISCOVERY LOADING STATE - STREAMING SKELETON
 * Per Next.js loading docs: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * 
 * Renders while fetching match discovery cards.
 * Grid of high-fidelity skeleton match cards.
 */

export default function MatchesLoading() {
  return <MatchesLoadingSkeleton />;
}
