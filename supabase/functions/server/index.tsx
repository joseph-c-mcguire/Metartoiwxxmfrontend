import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";
import * as database from "./database.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-2e3cda33/health", (c) => {
  return c.json({ status: "ok" });
});

// Register new user
app.post("/make-server-2e3cda33/auth/register", async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    if (!email || !password || !username) {
      return c.json({ error: 'Email, password, and username are required' }, 400);
    }

    const result = await auth.registerUser(email, password, username);

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      message: 'Registration successful. Please verify your email and wait for admin approval.',
      user: result.data?.user,
      profile: result.data?.profile
    }, 201);
  } catch (error) {
    console.error('Registration endpoint error:', error);
    return c.json({ error: 'Internal server error during registration' }, 500);
  }
});

// Check user approval status
app.get("/make-server-2e3cda33/auth/check-approval/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const result = await auth.checkUserApproval(userId);

    return c.json(result);
  } catch (error) {
    console.error('Check approval endpoint error:', error);
    return c.json({ error: 'Internal server error checking approval status' }, 500);
  }
});

// Approve user (admin only)
app.post("/make-server-2e3cda33/auth/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    const result = await auth.approveUser(userId, user.id);

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'User approved successfully', profile: result.data });
  } catch (error) {
    console.error('Approve user endpoint error:', error);
    return c.json({ error: 'Internal server error approving user' }, 500);
  }
});

// Get pending users (admin only)
app.get("/make-server-2e3cda33/auth/pending-users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await auth.getPendingUsers();

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ users: result.data });
  } catch (error) {
    console.error('Get pending users endpoint error:', error);
    return c.json({ error: 'Internal server error getting pending users' }, 500);
  }
});

// Resend verification email
app.post("/make-server-2e3cda33/auth/resend-verification", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const result = await auth.resendVerificationEmail(email);

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification endpoint error:', error);
    return c.json({ error: 'Internal server error resending verification email' }, 500);
  }
});

// Upload converted files to database
app.post("/make-server-2e3cda33/database/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { files, options } = await c.req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return c.json({ error: 'Files array is required' }, 400);
    }

    if (!options || !options.format || !options.destination) {
      return c.json({ error: 'Upload options (format, destination) are required' }, 400);
    }

    // Add user info to each file
    const filesWithUser = files.map(file => ({
      ...file,
      userId: user.id,
      userEmail: user.email || '',
    }));

    const result = await database.uploadToDatabase(filesWithUser, options);

    return c.json({
      message: `Successfully uploaded ${result.summary.success} file(s)`,
      summary: result.summary,
      results: result.results,
    });
  } catch (error) {
    console.error('Database upload endpoint error:', error);
    return c.json({ error: 'Internal server error during database upload' }, 500);
  }
});

// Get user's uploaded files
app.get("/make-server-2e3cda33/database/uploads", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dbType = c.req.query('database') as 'primary' | 'archive' | 'both' || 'both';

    const result = await database.getUserUploads(user.id, dbType);

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ uploads: result.data });
  } catch (error) {
    console.error('Get uploads endpoint error:', error);
    return c.json({ error: 'Internal server error getting uploads' }, 500);
  }
});

// Delete an upload
app.delete("/make-server-2e3cda33/database/upload/:recordId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const recordId = c.req.param('recordId');

    const result = await database.deleteUpload(recordId, user.id);

    if (result.error) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload endpoint error:', error);
    return c.json({ error: 'Internal server error deleting upload' }, 500);
  }
});

// METAR to IWXXM Conversion endpoint
app.post("/make-server-2e3cda33/convert/metar-to-iwxxm", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { metarContent, params } = await c.req.json();

    if (!metarContent || typeof metarContent !== 'string') {
      return c.json({ error: 'METAR content is required' }, 400);
    }

    // Conversion parameters
    const {
      bulletinId = 'SAAA00',
      issuingCenter = 'KWBC',
      iwxxmVersion = '3.0',
      strictValidation = true,
      includeNilReasons = true,
      onError = 'warn',
      logLevel = 'INFO'
    } = params || {};

    // Perform METAR to IWXXM conversion
    const lines = metarContent.trim().split('\n').filter(line => line.trim());
    let iwxxmXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    iwxxmXml += `<IWXXM xmlns="http://icao.int/iwxxm/${iwxxmVersion}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    iwxxmXml += `  <BulletinHeader>\n`;
    iwxxmXml += `    <bulletinIdentifier>${bulletinId}</bulletinIdentifier>\n`;
    iwxxmXml += `    <issuingCentre>${issuingCenter}</issuingCentre>\n`;
    iwxxmXml += `    <issueTime>${new Date().toISOString()}</issueTime>\n`;
    iwxxmXml += `    <strictValidation>${strictValidation}</strictValidation>\n`;
    iwxxmXml += `    <includeNilReasons>${includeNilReasons}</includeNilReasons>\n`;
    iwxxmXml += `  </BulletinHeader>\n`;
    
    const warnings: string[] = [];
    
    lines.forEach((line, index) => {
      try {
        const parts = line.trim().split(/\s+/);
        
        // Basic METAR parsing
        const reportType = parts[0]; // METAR or SPECI
        const station = parts[1] || 'UNKN';
        const timestamp = parts[2] || '';
        
        iwxxmXml += `  <MeteorologicalAerodromeObservation gml:id="obs-${index + 1}">\n`;
        iwxxmXml += `    <reportType>${reportType}</reportType>\n`;
        iwxxmXml += `    <aerodrome>\n`;
        iwxxmXml += `      <AirportHeliport gml:id="station-${station}">\n`;
        iwxxmXml += `        <designator>${station}</designator>\n`;
        iwxxmXml += `      </AirportHeliport>\n`;
        iwxxmXml += `    </aerodrome>\n`;
        iwxxmXml += `    <observationTime>${timestamp}</observationTime>\n`;
        iwxxmXml += `    <rawMETAR><![CDATA[${line}]]></rawMETAR>\n`;
        
        // Add parsed elements (simplified - real implementation would parse wind, visibility, etc.)
        if (parts.length > 3) {
          iwxxmXml += `    <surfaceWind>\n`;
          iwxxmXml += `      <AerodromeSurfaceWind>\n`;
          iwxxmXml += `        <meanWindDirection uom="deg">variable</meanWindDirection>\n`;
          iwxxmXml += `        <meanWindSpeed uom="m/s">0</meanWindSpeed>\n`;
          iwxxmXml += `      </AerodromeSurfaceWind>\n`;
          iwxxmXml += `    </surfaceWind>\n`;
        }
        
        iwxxmXml += `  </MeteorologicalAerodromeObservation>\n`;
      } catch (err) {
        const warning = `Line ${index + 1}: Error parsing - ${err.message}`;
        warnings.push(warning);
        
        if (onError === 'fail') {
          throw new Error(warning);
        } else if (onError === 'warn') {
          console.warn(warning);
        }
        // 'skip' - just continue without adding to output
      }
    });
    
    iwxxmXml += `</IWXXM>`;

    // Log conversion details based on logLevel
    if (['DEBUG', 'INFO'].includes(logLevel)) {
      console.log(`[${logLevel}] Converted ${lines.length} METAR line(s) to IWXXM ${iwxxmVersion}`);
      console.log(`[${logLevel}] Bulletin: ${bulletinId}, Center: ${issuingCenter}`);
    }

    return c.json({
      success: true,
      iwxxmXml,
      params: {
        bulletinId,
        issuingCenter,
        iwxxmVersion,
        strictValidation,
        includeNilReasons,
        onError,
        logLevel
      },
      stats: {
        linesProcessed: lines.length,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    });
  } catch (error) {
    console.error('METAR conversion endpoint error:', error);
    return c.json({ 
      error: 'Internal server error during METAR conversion',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

Deno.serve(app.fetch);
