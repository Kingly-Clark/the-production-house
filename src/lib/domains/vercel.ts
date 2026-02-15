// Production House — Vercel Domain API Integration
// Manages custom domains on Vercel project
// =============================================================

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

interface VercelDomainResponse {
  domain: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason?: string;
  }>;
  createdAt?: number;
  updatedAt?: number;
}

interface VercelDomainConfigResponse {
  misconfigured?: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason?: string;
  }>;
}

/**
 * Build Vercel API URL with optional team ID
 */
function buildVercelUrl(path: string): string {
  const baseUrl = 'https://api.vercel.com';
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  return `${baseUrl}${path}${teamParam ? (path.includes('?') ? '&' : '') + teamParam.substring(1) : ''}`;
}

/**
 * Make authenticated request to Vercel API
 */
async function vercelRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  if (!VERCEL_API_TOKEN) {
    throw new Error('VERCEL_API_TOKEN environment variable is not set');
  }

  if (!VERCEL_PROJECT_ID) {
    throw new Error('VERCEL_PROJECT_ID environment variable is not set');
  }

  const url = buildVercelUrl(path);
  const headers: HeadersInit = {
    'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Vercel API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Vercel request failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Add a domain to Vercel project
 */
export async function addDomainToVercel(domain: string): Promise<VercelDomainResponse> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  const path = `/v10/projects/${VERCEL_PROJECT_ID}/domains`;
  const body = { name: cleanDomain };

  const response = (await vercelRequest('POST', path, body)) as VercelDomainResponse;

  return response;
}

/**
 * Remove a domain from Vercel project
 */
export async function removeDomainFromVercel(domain: string): Promise<void> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  const path = `/v10/projects/${VERCEL_PROJECT_ID}/domains/${cleanDomain}`;

  await vercelRequest('DELETE', path);
}

/**
 * Get domain configuration from Vercel
 * Returns verification records and status
 */
export async function getDomainConfigFromVercel(
  domain: string
): Promise<VercelDomainConfigResponse> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  const path = `/v6/domains/${cleanDomain}/config`;

  const response = (await vercelRequest('GET', path)) as VercelDomainConfigResponse;

  return response;
}

/**
 * Get domain info including SSL status from Vercel
 */
export async function getVercelDomainInfo(domain: string): Promise<VercelDomainResponse> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  const path = `/v6/domains/${cleanDomain}`;

  const response = (await vercelRequest('GET', path)) as VercelDomainResponse;

  return response;
}

/**
 * Check if domain is verified on Vercel
 */
export async function isDomainVerifiedOnVercel(domain: string): Promise<boolean> {
  try {
    const domainInfo = await getVercelDomainInfo(domain);
    return domainInfo.verified === true;
  } catch (error) {
    console.error(`Error checking domain verification on Vercel:`, error);
    return false;
  }
}

/**
 * Get verification records needed for domain
 */
export async function getVercelVerificationRecords(
  domain: string
): Promise<Array<{ type: string; domain: string; value: string }>> {
  try {
    const config = await getDomainConfigFromVercel(domain);

    if (!config.verification) {
      return [];
    }

    return config.verification.map(record => ({
      type: record.type,
      domain: record.domain,
      value: record.value,
    }));
  } catch (error) {
    console.error(`Error getting verification records from Vercel:`, error);
    return [];
  }
}

/**
 * Check if domain is misconfigured on Vercel
 */
export async function isVercelDomainMisconfigured(domain: string): Promise<boolean> {
  try {
    const config = await getDomainConfigFromVercel(domain);
    return config.misconfigured === true;
  } catch (error) {
    console.error(`Error checking domain configuration on Vercel:`, error);
    return false;
  }
}
