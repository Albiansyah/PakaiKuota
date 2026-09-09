import 'server-only';

import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/gateway/auth';
import {
  authorizeRequest,
  finalizeRequest,
  getGatewayModel,
  getLatestForexRate,
} from '@/lib/gateway/billing';
import { enforceRateLimit } from '@/lib/gateway/rate-limit';
import { estimateCostUsd } from '@/lib/gateway/pricing';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_BODY_BYTES = 1_000_000;
const DEFAULT_MAX_TOKENS = 4096;
const MAX_TOKENS = 4096;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status },
  );
}

function tokenCount(value: unknown): number {
  if (!Array.isArray(value)) return 0;

  return value.reduce((total, item) => {
    if (!item || typeof item !== 'object') return total;

    const content = (item as { content?: unknown }).content;

    return total + (
      typeof content === 'string'
        ? Math.ceil(content.length / 4)
        : 0
    );
  }, 0);
}

function extractUsage(payload: unknown): {
  input: number;
  output: number;
} {
  if (!payload || typeof payload !== 'object') {
    return {
      input: 0,
      output: 0,
    };
  }

  const usage = (payload as {
    usage?: {
      prompt_tokens?: unknown;
      completion_tokens?: unknown;
      input_tokens?: unknown;
      output_tokens?: unknown;
    };
  }).usage;

  if (!usage || typeof usage !== 'object') {
    return {
      input: 0,
      output: 0,
    };
  }

  const input =
    typeof usage.prompt_tokens === 'number'
      ? usage.prompt_tokens
      : typeof usage.input_tokens === 'number'
        ? usage.input_tokens
        : 0;

  const output =
    typeof usage.completion_tokens === 'number'
      ? usage.completion_tokens
      : typeof usage.output_tokens === 'number'
        ? usage.output_tokens
        : 0;

  return {
    input: Math.max(0, Math.floor(input)),
    output: Math.max(0, Math.floor(output)),
  };
}

export async function POST(request: Request) {
  // ------------------------------------------------------------
  // 1. Request size protection
  // ------------------------------------------------------------

  const contentLength = Number(
    request.headers.get('content-length') ?? 0,
  );

  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse(
      'REQUEST_TOO_LARGE',
      'Request body exceeds 1MB',
      413,
    );
  }

  // ------------------------------------------------------------
  // 2. Authenticate API key
  // ------------------------------------------------------------

  const rawKey = request.headers.get('authorization');

  const identity = await authenticateApiKey(rawKey ?? '');

  if (!identity) {
    return errorResponse(
      'INVALID_API_KEY',
      'API key is invalid or revoked',
      401,
    );
  }

  // ------------------------------------------------------------
  // 3. Rate limit
  // ------------------------------------------------------------

  const ip =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ?? 'unknown';

  try {
    const [keyLimit, userLimit, ipLimit] = await Promise.all([
      enforceRateLimit(
        `key:${identity.keyId}`,
        10,
        60,
      ),

      enforceRateLimit(
        `user:${identity.userId}`,
        20,
        60,
      ),

      enforceRateLimit(
        `ip:${ip}`,
        30,
        60,
      ),
    ]);

    if (
      !keyLimit.allowed ||
      !userLimit.allowed ||
      !ipLimit.allowed
    ) {
      return errorResponse(
        'RATE_LIMITED',
        'Rate limit exceeded',
        429,
      );
    }
  } catch {
    return errorResponse(
      'RATE_LIMITED',
      'Rate limiter unavailable',
      503,
    );
  }

  // ------------------------------------------------------------
  // 4. Parse request body
  // ------------------------------------------------------------

  let body: {
    model?: string;
    messages?: unknown[];
    max_tokens?: number;
    stream?: boolean;
    temperature?: number;
    top_p?: number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorResponse(
      'INVALID_REQUEST',
      'Request body must be valid JSON',
      400,
    );
  }

  // ------------------------------------------------------------
  // 5. Validate required fields
  // ------------------------------------------------------------

  if (
    !body.model ||
    !Array.isArray(body.messages)
  ) {
    return errorResponse(
      'INVALID_REQUEST',
      'model and messages are required',
      400,
    );
  }

  const maxTokens =
    body.max_tokens ?? DEFAULT_MAX_TOKENS;

  if (
    !Number.isInteger(maxTokens) ||
    maxTokens < 1 ||
    maxTokens > MAX_TOKENS
  ) {
    return errorResponse(
      'INVALID_REQUEST',
      `max_tokens must be between 1 and ${MAX_TOKENS}`,
      400,
    );
  }

  // ------------------------------------------------------------
  // 6. Resolve model
  // ------------------------------------------------------------

  const model = await getGatewayModel(body.model);

  if (!model) {
    return errorResponse(
      'MODEL_NOT_FOUND',
      'Model was not found',
      404,
    );
  }

  if (model.enabled === false) {
    return errorResponse(
      'MODEL_DISABLED',
      'Model is disabled',
      403,
    );
  }

  // ------------------------------------------------------------
  // 7. Get current USD -> IDR rate
  // ------------------------------------------------------------

  const forexRate = await getLatestForexRate();

  if (!forexRate) {
    return errorResponse(
      'UPSTREAM_ERROR',
      'No current forex rate available',
      503,
    );
  }

  // ------------------------------------------------------------
  // 8. Estimate input tokens + authorization hold
  // ------------------------------------------------------------

  const estimatedInput = tokenCount(
    body.messages,
  );

  const estimatedCostUsd = estimateCostUsd(
    estimatedInput,
    maxTokens,
    model,
  );

  const idempotencyKey =
    request.headers.get('idempotency-key');

  const authorization = await authorizeRequest({
    userId: identity.userId,
    modelId: model.id,
    estimatedCostUsd,
    forexRate,
    idempotencyKey,
  });

  if (
    authorization.error ||
    !authorization.data
  ) {
    console.error(
      'authorize_request failed',
      authorization.error,
    );

    const code =
      authorization.error?.message.includes(
        'INSUFFICIENT_BALANCE',
      )
        ? 'INSUFFICIENT_BALANCE'
        : 'AUTHORIZATION_FAILED';

    return errorResponse(
      code,
      'Unable to reserve quota',
      code === 'INSUFFICIENT_BALANCE'
        ? 402
        : 500,
    );
  }

  // ------------------------------------------------------------
  // 9. Load NewAPI configuration
  // ------------------------------------------------------------

  const config = await createSupabaseAdminClient()
    .from('newapi_config')
    .select(
      'base_url, api_key, is_active',
    )
    .eq('id', 1)
    .maybeSingle();

  const configuredUrl =
    config.data?.is_active === false
      ? null
      : config.data?.base_url ??
        process.env.UPSTREAM_CHAT_COMPLETIONS_URL;

  const upstreamUrl = configuredUrl
    ? new URL(configuredUrl).pathname.endsWith(
        '/v1/chat/completions',
      )
      ? configuredUrl
      : new URL(
          '/v1/chat/completions',
          configuredUrl,
        ).toString()
    : null;

  const upstreamKey =
    config.data?.is_active === false
      ? null
      : config.data?.api_key ??
        process.env.UPSTREAM_API_KEY;

  // ------------------------------------------------------------
  // 10. Verify NewAPI configuration
  // ------------------------------------------------------------

  if (!upstreamUrl || !upstreamKey) {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_ERROR',
      'Upstream gateway is not configured',
      502,
    );
  }

  // ------------------------------------------------------------
  // 11. Build upstream request
  // ------------------------------------------------------------

  const upstreamBody = {
    ...body,
    model: model.name ?? body.model,
  };

  // DEBUG ONLY
  // Remove/redact these logs after billing verification.
  console.log(
    '[DEBUG] upstream model:',
    upstreamBody.model,
  );

  console.log(
    '[DEBUG] upstream URL:',
    upstreamUrl,
  );

  console.log(
    '[DEBUG] request billing estimate:',
    {
      model: body.model,
      estimatedInput,
      maxTokens,
      estimatedCostUsd,
      forexRate,
    },
  );

  // Jangan log seluruh upstreamBody karena bisa berisi
  // prompt/user content.
  // console.log('[DEBUG] upstream body:', JSON.stringify(upstreamBody));

  // ------------------------------------------------------------
  // 12. Call NewAPI
  // ------------------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    120_000,
  );

  let upstream: Response;

  try {
    upstream = await fetch(
      upstreamUrl,
      {
        method: 'POST',

        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${upstreamKey}`,
        },

        body: JSON.stringify(upstreamBody),

        signal: controller.signal,
      },
    );
  } catch {
    clearTimeout(timeout);

    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_TIMEOUT',
      'Upstream did not respond',
      504,
    );
  }

  clearTimeout(timeout);

  // ------------------------------------------------------------
  // 13. Upstream response body check
  // ------------------------------------------------------------

  if (!upstream.body) {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_ERROR',
      `Upstream request failed (${upstream.status})`,
      502,
    );
  }

  // ------------------------------------------------------------
  // 14. Streaming response
  // ------------------------------------------------------------
  //
  // IMPORTANT:
  // Streaming belum aman untuk production billing karena
  // usage SSE belum kita parse.
  //
  // Untuk sementara kita reject stream=true supaya billing
  // tidak memakai estimasi max_tokens sebagai actual usage.
  //

  if (body.stream) {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'STREAMING_NOT_SUPPORTED',
      'Streaming is temporarily disabled while usage-based billing is being finalized',
      400,
    );
  }

  // ------------------------------------------------------------
  // 15. Read normal JSON response
  // ------------------------------------------------------------

  const rawText = await upstream.text();

  console.log(
    '[DEBUG] upstream status:',
    upstream.status,
  );

  // DEBUG ONLY.
  // Jangan log seluruh response production karena response
  // dapat mengandung data user.
  console.log(
    '[DEBUG] upstream response length:',
    rawText.length,
  );

  // ------------------------------------------------------------
  // 16. Handle upstream error
  // ------------------------------------------------------------

  if (!upstream.ok) {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_ERROR',
      `Upstream request failed (${upstream.status}): ${rawText.slice(0, 300)}`,
      502,
    );
  }

  // ------------------------------------------------------------
  // 17. Parse JSON
  // ------------------------------------------------------------

  let payload: unknown;

  try {
    payload = JSON.parse(rawText);
  } catch {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_ERROR',
      'Upstream returned an invalid JSON response',
      502,
    );
  }

  if (
    payload === null ||
    typeof payload !== 'object'
  ) {
    await finalizeRequest({
      requestId: authorization.data,
      status: 'failed',
    });

    return errorResponse(
      'UPSTREAM_ERROR',
      'Upstream returned an empty response',
      502,
    );
  }

  // ------------------------------------------------------------
  // 18. Extract ACTUAL usage from upstream
  // ------------------------------------------------------------

  const usage = extractUsage(payload);

  console.log(
    '[BILLING DEBUG] extracted usage:',
    {
      input: usage.input,
      output: usage.output,
      estimatedInput,
      maxTokens,
    },
  );

  const hasActualUsage =
    usage.input > 0 ||
    usage.output > 0;

  // ------------------------------------------------------------
  // 19. Determine actual token usage
  // ------------------------------------------------------------
  //
  // Normal OpenAI/NewAPI/OpenRouter response:
  //
  // usage.prompt_tokens
  // usage.completion_tokens
  //
  // Kalau upstream tidak memberikan usage sama sekali,
  // fallback ke estimate supaya request tetap bisa ditagih.
  //
  // NOTE:
  // fallback ini masih merupakan estimasi.
  //

  const actualInputTokens =
    hasActualUsage
      ? usage.input
      : estimatedInput;

  const actualOutputTokens =
    hasActualUsage
      ? usage.output
      : maxTokens;

  // ------------------------------------------------------------
  // 20. Calculate final retail cost
  // ------------------------------------------------------------

  const actualCostUsd = estimateCostUsd(
    actualInputTokens,
    actualOutputTokens,
    model,
  );

  console.log(
    '[BILLING DEBUG] finalizing:',
    {
      requestId: authorization.data,
      inputTokens: actualInputTokens,
      outputTokens: actualOutputTokens,
      totalTokens:
        actualInputTokens +
        actualOutputTokens,
      actualCostUsd,
      forexRate,
      hasActualUsage,
    },
  );

  // ------------------------------------------------------------
  // 21. Finalize billing
  // ------------------------------------------------------------

  const finalized = await finalizeRequest({
    requestId: authorization.data,
    status: 'completed',
    actualCostUsd,
    forexRate,
    inputTokens: actualInputTokens,
    outputTokens: actualOutputTokens,
  });

  if (finalized.error) {
    console.error(
      '[BILLING ERROR] finalize_request failed:',
      finalized.error,
    );

    return errorResponse(
      'BILLING_FINALIZE_FAILED',
      'Unable to finalize billing',
      500,
    );
  }

  // ------------------------------------------------------------
  // 22. Return OpenAI-compatible response
  // ------------------------------------------------------------

  return NextResponse.json(
    payload,
    { status: 200 },
  );
}