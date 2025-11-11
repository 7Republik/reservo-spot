#!/usr/bin/env node

/**
 * Supabase Reserveo MCP Server
 * 
 * Provides tools for managing the Supabase project for Reserveo:
 * - Query database directly
 * - List and describe tables
 * - Manage migrations
 * - View project information
 * - Execute Supabase CLI commands
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pevpefnemqvyygkrcwir.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldnBlZm5lbXF2eXlna3Jjd2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjgyMTksImV4cCI6MjA3Nzk0NDIxOX0.A7iro-wAVpeHGyC9UtKI3TVIATQ8uOH84FEF-twfpP8';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'pevpefnemqvyygkrcwir';

// Get workspace root - the MCP server runs from workspace root by default
const WORKSPACE_ROOT = process.cwd();

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create MCP server
const server = new Server(
  {
    name: 'supabase-reserveo',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool Definitions
 */
const TOOLS = [
  {
    name: 'supabase_query',
    description: 'Execute a SQL query on the Supabase database (SELECT only for safety)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL SELECT query to execute',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'supabase_list_tables',
    description: 'List all tables in the public schema',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_describe_table',
    description: 'Get detailed information about a specific table (columns, types, constraints)',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Name of the table to describe',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'supabase_list_migrations',
    description: 'List all migration files in the supabase/migrations directory',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_read_migration',
    description: 'Read the content of a specific migration file',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Name of the migration file to read',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'supabase_get_project_info',
    description: 'Get information about the Supabase project',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_cli_status',
    description: 'Check Supabase CLI status and local services',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'supabase_cli_command',
    description: 'Execute a Supabase CLI command (use with caution)',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Supabase CLI command to execute (e.g., "db diff", "migration list")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'supabase_count_records',
    description: 'Count records in a table with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Name of the table',
        },
        filters: {
          type: 'object',
          description: 'Optional filters as key-value pairs',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'supabase_get_rls_policies',
    description: 'Get Row Level Security policies for a table',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Name of the table',
        },
      },
      required: ['tableName'],
    },
  },
];

/**
 * Tool Handlers
 */
async function handleSupabaseQuery(query) {
  try {
    // Security: Only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed for safety. Use supabase_cli_command for other operations.');
    }

    // Parse simple queries to extract table name
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Could not parse table name from query. Use simpler SELECT statements or supabase_cli_command for complex queries.');
    }

    const tableName = tableMatch[1];
    
    // Try to execute as a simple select
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(100);
    
    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return {
      success: true,
      data,
      rowCount: data?.length || 0,
      note: 'Simplified query executed. For complex queries, use supabase_cli_command with psql.',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: 'For complex SQL queries, use supabase_cli_command with: db remote psql -c "YOUR_QUERY"',
    };
  }
}

async function handleListTables() {
  try {
    // Read migrations to extract table names
    const migrationsPath = join(WORKSPACE_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsPath);
    
    const tables = new Set();
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      const content = await readFile(join(migrationsPath, file), 'utf-8');
      
      // Extract CREATE TABLE statements
      const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
      let match;
      
      while ((match = createTableRegex.exec(content)) !== null) {
        tables.add(match[1]);
      }
    }

    const tableList = Array.from(tables).sort().map(name => ({
      table_name: name,
      table_type: 'BASE TABLE',
    }));

    return {
      success: true,
      tables: tableList,
      count: tableList.length,
      source: 'Extracted from migration files',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: 'Make sure supabase/migrations directory exists',
    };
  }
}

async function handleDescribeTable(tableName) {
  try {
    // Read migrations to find table definition
    const migrationsPath = join(WORKSPACE_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsPath);
    
    let tableDefinition = null;
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      const content = await readFile(join(migrationsPath, file), 'utf-8');
      
      // Find CREATE TABLE statement for this table
      const createTableRegex = new RegExp(
        `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${tableName}\\s*\\([^;]+\\);`,
        'is'
      );
      
      const match = content.match(createTableRegex);
      if (match) {
        tableDefinition = match[0];
        break;
      }
    }

    if (!tableDefinition) {
      throw new Error(`Table '${tableName}' not found in migrations`);
    }

    // Parse columns from definition
    const columns = [];
    const columnRegex = /(\w+)\s+(UUID|TEXT|INTEGER|BOOLEAN|TIMESTAMPTZ|DATE|JSONB|BIGINT|NUMERIC|INET)([^,\n]*)/gi;
    let match;
    
    while ((match = columnRegex.exec(tableDefinition)) !== null) {
      const [, columnName, dataType, constraints] = match;
      
      // Skip if it's a keyword like PRIMARY, FOREIGN, etc.
      if (['PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'REFERENCES'].includes(columnName.toUpperCase())) {
        continue;
      }
      
      columns.push({
        column_name: columnName,
        data_type: dataType.toLowerCase(),
        is_nullable: !constraints.toUpperCase().includes('NOT NULL') ? 'YES' : 'NO',
        column_default: constraints.match(/DEFAULT\s+([^\s,]+)/i)?.[1] || null,
      });
    }

    return {
      success: true,
      tableName,
      columns,
      columnCount: columns.length,
      source: 'Extracted from migration files',
      definition: tableDefinition,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleListMigrations() {
  try {
    const migrationsPath = join(WORKSPACE_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsPath);
    
    const migrations = files
      .filter(f => f.endsWith('.sql'))
      .sort()
      .map(filename => {
        const match = filename.match(/^(\d{14})_(.+)\.sql$/);
        return {
          filename,
          timestamp: match ? match[1] : null,
          name: match ? match[2] : filename,
        };
      });

    return {
      success: true,
      migrations,
      count: migrations.length,
      path: migrationsPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleReadMigration(filename) {
  try {
    const migrationPath = join(WORKSPACE_ROOT, 'supabase', 'migrations', filename);
    const content = await readFile(migrationPath, 'utf-8');

    return {
      success: true,
      filename,
      content,
      lines: content.split('\n').length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleGetProjectInfo() {
  return {
    success: true,
    project: {
      ref: PROJECT_REF,
      url: SUPABASE_URL,
      dashboard: `https://supabase.com/dashboard/project/${PROJECT_REF}`,
      apiDocs: `https://supabase.com/dashboard/project/${PROJECT_REF}/api`,
      tableEditor: `https://supabase.com/dashboard/project/${PROJECT_REF}/editor`,
      sqlEditor: `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`,
      auth: `https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`,
      storage: `https://supabase.com/dashboard/project/${PROJECT_REF}/storage/buckets`,
    },
  };
}

async function handleCliStatus() {
  try {
    const { stdout, stderr } = await execAsync('supabase status', {
      cwd: WORKSPACE_ROOT,
    });

    return {
      success: true,
      output: stdout,
      error: stderr || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: 'Supabase CLI might not be installed or local services are not running. Run "supabase start" to start local services.',
    };
  }
}

async function handleCliCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(`supabase ${command}`, {
      cwd: WORKSPACE_ROOT,
    });

    return {
      success: true,
      command: `supabase ${command}`,
      output: stdout,
      error: stderr || null,
    };
  } catch (error) {
    return {
      success: false,
      command: `supabase ${command}`,
      error: error.message,
    };
  }
}

async function handleCountRecords(tableName, filters = {}) {
  try {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count records: ${error.message}`);
    }

    return {
      success: true,
      tableName,
      count,
      filters,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function handleGetRlsPolicies(tableName) {
  try {
    // Read migrations to find RLS policies
    const migrationsPath = join(WORKSPACE_ROOT, 'supabase', 'migrations');
    const files = await readdir(migrationsPath);
    
    const policies = [];
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      
      const content = await readFile(join(migrationsPath, file), 'utf-8');
      
      // Find CREATE POLICY statements for this table
      const policyRegex = new RegExp(
        `CREATE\\s+POLICY\\s+"([^"]+)"\\s+ON\\s+(?:public\\.)?${tableName}\\s+FOR\\s+(\\w+)\\s+(?:TO\\s+([^\\s]+)\\s+)?(?:USING\\s*\\(([^)]+)\\))?(?:\\s+WITH\\s+CHECK\\s*\\(([^)]+)\\))?`,
        'gi'
      );
      
      let match;
      while ((match = policyRegex.exec(content)) !== null) {
        const [, policyName, command, roles, using, withCheck] = match;
        
        policies.push({
          policyname: policyName,
          tablename: tableName,
          cmd: command.toUpperCase(),
          roles: roles || 'public',
          qual: using || null,
          with_check: withCheck || null,
        });
      }
    }

    return {
      success: true,
      tableName,
      policies,
      count: policies.length,
      source: 'Extracted from migration files',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Register handlers
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'supabase_query':
        result = await handleSupabaseQuery(args.query);
        break;
      case 'supabase_list_tables':
        result = await handleListTables();
        break;
      case 'supabase_describe_table':
        result = await handleDescribeTable(args.tableName);
        break;
      case 'supabase_list_migrations':
        result = await handleListMigrations();
        break;
      case 'supabase_read_migration':
        result = await handleReadMigration(args.filename);
        break;
      case 'supabase_get_project_info':
        result = await handleGetProjectInfo();
        break;
      case 'supabase_cli_status':
        result = await handleCliStatus();
        break;
      case 'supabase_cli_command':
        result = await handleCliCommand(args.command);
        break;
      case 'supabase_count_records':
        result = await handleCountRecords(args.tableName, args.filters);
        break;
      case 'supabase_get_rls_policies':
        result = await handleGetRlsPolicies(args.tableName);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Supabase Reserveo MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
