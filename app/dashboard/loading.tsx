import { DashboardLoadingSkeleton } from "@/components/loading-skeletons";

/**
 * DASHBOARD LOADING STATE - STREAMING SKELETON
 * Per Next.js loading docs: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 * 
 * Renders while dashboard page is being fetched from server.
 * Uses high-fidelity skeleton components for optimal perceived performance.
 */

export default function DashboardLoading() {
  return <DashboardLoadingSkeleton />;
}
