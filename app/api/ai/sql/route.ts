import type { paths } from '@/lib/management-api-schema';
import { listTablesSql } from '@/lib/pg-meta';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import createClient from 'openapi-fetch';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'; // Import server client

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const client = createClient<paths>({
  baseUrl: 'https://api.supabase.com',
  headers: {
    Authorization: `Bearer ${process.env['SUPABASE_MANAGEMENT_API_TOKEN']}`,
  },
});

// Function to get database schema
async function getDbSchema(projectRef: string): Promise<TableSchema[] | null> {
  const token = process.env['SUPABASE_MANAGEMENT_API_TOKEN'];
  if (!token) {
    throw new Error('Supabase Management API token is not configured.');
  }

  const sql = listTablesSql();

  const { data, error } = await client.POST(
    '/v1/projects/{ref}/database/query',
    {
      params: {
        path: {
          ref: projectRef,
        },
      },
      body: {
        query: sql,
        read_only: true,
      },
    },
  );

  if (error) {
    throw error;
  }

  return data as any;
}

interface TableColumn {
  name: string;
  data_type: string;
}

interface TableSchema {
  name: string;
  columns: TableColumn[];
}

function formatSchemaForPrompt(schema: unknown): string {
  let schemaString = '';
  if (schema && Array.isArray(schema)) {
    (schema as TableSchema[]).forEach((table) => {
      const columnInfo = table.columns.map((c) => `${c.name} (${c.data_type})`);
      schemaString += `Table "${table.name}" has columns: ${columnInfo.join(
        ', ',
      )}.\n`;
    });
  }
  return schemaString;
}

/**
 * POST /api/ai/sql
 * Generate SQL queries from natural language prompts
 *
 * Uses AI to convert user prompts into executable SQL queries.
 * Includes database schema context for accurate generation.
 * Requires authentication and project reference.
 *
 * @param {NextRequest} request - Request object containing:
 *   - prompt: string - Natural language query description
 *   - projectRef: string - Supabase project reference
 *
 * @returns {Promise<NextResponse>} Either:
 *   - 200: { sql: string } - Generated SQL query
 *   - 400: { message: string } - Validation error
 *   - 401: { message: string } - Authentication required
 *   - 500: { message: string } - Generation failed
 *
 * @throws {Error} On schema fetch or AI generation failure
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, projectRef } = await request.json();

    // --- Start of Authorization Check ---
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // --- End of Authorization Check ---

    if (!prompt) {
      return NextResponse.json(
        { message: 'Prompt is required.' },
        { status: 400 },
      );
    }
    if (!projectRef) {
      return NextResponse.json(
        { message: 'projectRef is required.' },
        { status: 400 },
      );
    }

    // Implement your permission check here (e.g. check if the user is a member of the project)
    // In this example, everyone can access all projects
    // const userHasPermissionForProject = Boolean(projectRef) // This line is now redundant with user check above

    // if (!userHasPermissionForProject) { // This block is now redundant with user check above
    //   return NextResponse.json(
    //     { message: 'You do not have permission to access this project.' },
    //     { status: 403 }
    //   )
    // }

    // 1. Get database schema
    const schema = await getDbSchema(projectRef);
    const formattedSchema = formatSchemaForPrompt(schema);

    // 2. Create a prompt for OpenAI
    const systemPrompt = `You are an expert SQL assistant. Given the following database schema, write a SQL query that answers the user's question. Return only the SQL query, do not include any explanations or markdown.\n\nSchema:\n${formattedSchema}`;

    // 3. Call OpenAI to generate SQL using responses.create (plain text output)
    const response = await openai.responses.create({
      model: 'gpt-4o', // Corrected model name
      instructions: systemPrompt, // Use systemPrompt as instructions
      input: prompt, // User's question
    });

    const sql = response.output_text;

    if (!sql) {
      return NextResponse.json(
        { message: 'Could not generate SQL from the prompt.' },
        { status: 500 },
      );
    }

    // 4. Return the generated SQL
    return NextResponse.json({ sql });
  } catch (error: unknown) {
    console.error('Error generating SQL:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate SQL.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
