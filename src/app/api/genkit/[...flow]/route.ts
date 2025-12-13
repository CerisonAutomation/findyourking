'use server';

import { runFlow } from 'genkit/flow';
import { logger } from '@/lib/logger';
import {NextRequest, NextResponse} from "next/server";

// Import Genkit configuration
import '@/ai/genkit';

// Import all flows to make them available
import * as matchingFlows from '@/ai/flows/matching';

const allFlows = {
  ...matchingFlows,
};

export async function POST(req: NextRequest, { params }: { params: { flow: string[] } }) {
  const flowName = params.flow.join('/');
  const input = await req.json();

  logger.info(`Executing flow '${flowName}' with input:`, input);

  if (flowName in allFlows) {
    try {
      // @ts-ignore
      const flow = allFlows[flowName];
      const result = await runFlow(flow, input);
      return NextResponse.json(result);
    } catch (error) {
      logger.error(`Error executing flow '${flowName}':`, error);
      return new Response(JSON.stringify({ error: 'Flow execution failed' }), { status: 500 });
    }
  } else {
    logger.warn(`Flow '${flowName}' not found.`);
    return new Response(JSON.stringify({ error: 'Flow not found' }), { status: 404 });
  }
}
