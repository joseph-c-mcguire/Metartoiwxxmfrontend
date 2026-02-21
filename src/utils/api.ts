/**
 * Backend API Client
 * 
 * Handles all communication with the METAR to IWXXM backend API.
 * All endpoints use the versioned base path: /api/v1/
 */

import { getRequiredEnvVar } from './env';

const BACKEND_URL = getRequiredEnvVar('VITE_BACKEND_URL');
const API_BASE = `${BACKEND_URL}/api/v1`;

/**
 * Timeout wrapper for fetch requests
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs / 1000}s - Backend may be unreachable`)), timeoutMs)
    ),
  ]);
}

export interface ConversionResult {
  name: string;
  content: string;
  source: string;
  size_bytes: number;
}

export interface ConversionIssue {
  source: string;
  message: string;
  hint?: string;
  code?: string;
  severity: 'error' | 'warning' | 'info';
  layer?: string;
  location?: string;
}

export interface ConversionResponse {
  results: ConversionResult[];
  errors: string[];
  issues: ConversionIssue[];
  total_processed: number;
  successful: number;
  failed: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  version: string;
  gifts_available: boolean;
}

export interface ApiError {
  message: string;
  errors: string[];
  issues?: ConversionIssue[];
  total_errors?: number;
}

export class ConversionApiError extends Error {
  errors: string[];
  issues: ConversionIssue[];
  status?: number;

  constructor(message: string, errors: string[] = [], issues: ConversionIssue[] = [], status?: number) {
    super(message);
    this.name = 'ConversionApiError';
    this.errors = errors;
    this.issues = issues;
    this.status = status;
  }
}

/**
 * Get the access token from local storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('supabase_access_token');
}

/**
 * Create authorization headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
}

/**
 * Check backend health status
 * 
 * **Endpoint**: GET /health
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * Convert METAR/SPECI text to IWXXM XML
 * 
 * Supports both manual text input and file uploads.
 * 
 * **Endpoint**: POST /api/v1/convert
 * 
 * @param params - Conversion parameters
 * @param params.manualText - Optional: METAR text to convert
 * @param params.files - Optional: File list to convert
 * @returns Conversion results with XML content
 */
export async function convertMetarToIwxxm(params: {
  manualText?: string;
  files?: File[];
  iwxxmVersion?: string;
  validateOutput?: boolean;
  accessToken?: string;
}): Promise<ConversionResponse> {
  const formData = new FormData();
  const requestStartedAt = Date.now();

  if (params.manualText?.trim()) {
    formData.append('manual_text', params.manualText.trim());
  }

  if (params.files && params.files.length > 0) {
    params.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  // Add IWXXM version (default to 2025-2)
  formData.append('iwxxm_version', params.iwxxmVersion || '2025-2');

  // Add validation flag (default to false)
  formData.append('validate_output', params.validateOutput ? 'true' : 'false');

  try {
    const token = params.accessToken || getAccessToken() || '';
    const requestUrl = `${API_BASE}/convert`;
    console.info('[API][CONVERT] Request start', {
      url: requestUrl,
      method: 'POST',
      origin: window.location.origin,
      hasAuthToken: Boolean(token),
      tokenLength: token.length,
      manualTextProvided: Boolean(params.manualText?.trim()),
      fileCount: params.files?.length || 0,
      iwxxmVersion: params.iwxxmVersion || '2025-2',
      validateOutput: Boolean(params.validateOutput),
    });

    const response = await withTimeout(
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }),
      30000
    );

    console.info('[API][CONVERT] Response received', {
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - requestStartedAt,
    });

    if (!response.ok) {
      let errorText = '';
      if (typeof response.text === 'function') {
        errorText = await response.text().catch(() => '');
      } else if (typeof response.json === 'function') {
        const jsonFallback = await response.json().catch(() => null);
        errorText = jsonFallback ? JSON.stringify(jsonFallback) : '';
      }

      let error: any = {
        message: `Conversion failed: ${response.statusText}`,
        errors: [],
        issues: [],
      };
      try {
        error = errorText ? JSON.parse(errorText) : error;
      } catch {
        // Keep fallback error shape
      }

      console.error('[API][CONVERT] Non-2xx response', {
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - requestStartedAt,
        bodySnippet: errorText.slice(0, 500),
      });

      throw new ConversionApiError(
        error.detail?.message || error.message || `HTTP ${response.status}`,
        error.detail?.errors || error.errors || [],
        error.detail?.issues || error.issues || [],
        response.status
      );
    }

    const data = await response.json();
    console.info('[API][CONVERT] Response parsed', {
      successful: data?.successful,
      failed: data?.failed,
      totalProcessed: data?.total_processed,
      durationMs: Date.now() - requestStartedAt,
    });

    return {
      ...data,
      issues: data?.issues || [],
    };
  } catch (error) {
    const durationMs = Date.now() - requestStartedAt;

    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('[API][CONVERT][TIMEOUT]', {
        message: error.message,
        durationMs,
      });
      throw error;
    }

    if (error instanceof ConversionApiError) {
      throw error;
    }

    console.error('[API][CONVERT][ERROR]', {
      durationMs,
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Convert METAR/SPECI text to IWXXM XML in a ZIP file
 * 
 * Supports batch conversion with both text and files.
 * Returns a ZIP archive containing converted XML files.
 * 
 * **Endpoint**: POST /api/v1/convert-zip
 * 
 * @param params - Conversion parameters
 * @param params.manualText - Optional: METAR text to convert
 * @param params.files - Optional: File list to convert
 * @returns Blob containing ZIP file with converted XMLs
 */
export async function convertMetarToIwxxmZip(params: {
  manualText?: string;
  files?: File[];
}): Promise<Blob> {
  const formData = new FormData();

  if (params.manualText?.trim()) {
    formData.append('manual_text', params.manualText.trim());
  }

  if (params.files && params.files.length > 0) {
    params.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/convert-zip`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken() || ''}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `ZIP conversion failed: ${response.statusText}`,
        errors: [],
      }));
      throw new Error(error.detail?.message || error.message);
    }

    return await response.blob();
  } catch (error) {
    console.error('ZIP conversion error:', error);
    throw error;
  }
}

/**
 * Download file from blob
 * 
 * @param blob - File blob to download
 * @param filename - Filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  checkHealth,
  convertMetarToIwxxm,
  convertMetarToIwxxmZip,
  downloadBlob,
};
