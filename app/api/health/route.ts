/**
 * Health Check Endpoint - Zenith Level
 * 
 * Used by:
 * - Docker healthcheck
 * - Load balancers
 * - Monitoring systems
 * - CI/CD pipelines
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    const dbHealthy = !dbError || dbError.code === "PGRST116"; // PGRST116 = no rows, but connection is OK

    const responseTime = Date.now() - startTime;

    // Health status
    const status = dbHealthy ? "healthy" : "degraded";

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        checks: {
          database: dbHealthy ? "ok" : "degraded",
          api: "ok",
        },
        version: process.env['NEXT_PUBLIC_APP_VERSION'] || "1.0.0",
        environment: process.env['NODE_ENV'],
      },
      {
        status: dbHealthy ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  }
}

