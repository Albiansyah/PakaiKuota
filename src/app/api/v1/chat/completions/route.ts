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

const MAX_BODY_BYTES = 1_000_000;
const DEFAULT_MAX_TOKENS = 4096;
const MAX_TOKENS = 4096;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function tokenCount(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.reduce((total, item) => {
    if (!item || typeof item !== 'object') return total;
    const content = (item as { content?: unknown }).content;
    return total + (typeof content === 'string' ? Math.ceil(content.length / 4) : 0);
  }, 0);
}

function extractUsage(payload: unknown): { input: number; output: number } {
  if (!payload || typeof payload !== 'object') return { input: 0, output: 0 };
  const usage = (payload as {
    usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
  }).usage;
  return {
    input: usage?.prompt_tokens ?? usage?.input_tokens ?? 0,
    output: usage?.completion_tokens ?? usage?.output_tokens ?? 0,
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse('REQUEST_TOO_LARGE', 'Request body exceeds 1MB', 413);
  }

  const rawKey = request.headers.get('authorization');
  const identity = await authenticateApiKey(rawKey ?? '');
  if (!identity) return errorResponse('INVALID_API_KEY', 'API key is invalid or revoked', 401);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  try {
    const [keyLimit, userLimit, ipLimit] = await Promise.all([
      enforceRateLimit(`key:${identity.keyId}`, 10, 60),
      enforceRateLimit(`user:${identity.userId}`, 20, 60),
      enforceRateLimit(`ip:${ip}`, 30, 60),
    ]);
    if (!keyLimit.allowed || !userLimit.allowed || !ipLimit.allowed) {
      return errorResponse('RATE_LIMITED', 'Rate limit exceeded', 429);
    }
  } catch {
    return errorResponse('RATE_LIMITED', 'Rate limiter unavailable', 503);
  }

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
    return errorResponse('INVALID_REQUEST', 'Request body must be valid JSON', 400);
  }

  if (!body.model || !Array.isArray(body.messages)) {
    return errorResponse('INVALID_REQUEST', 'model and messages are required', 400);
  }
  const maxTokens = body.max_tokens ?? DEFAULT_MAX_TOKENS;
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > MAX_TOKENS) {
    return errorResponse('INVALID_REQUEST', `max_tokens must be between 1 and ${MAX_TOKENS}`, 400);
  }

  const model = await getGatewayModel(body.model);
  if (!model) return errorResponse('MODEL_NOT_FOUND', 'Model was not found', 404);
  if (model.enabled === false) return errorResponse('MODEL_DISABLED', 'Model is disabled', 403);

  const forexRate = await getLatestForexRate();
  if (!forexRate) return errorResponse('UPSTREAM_ERROR', 'No current forex rate available', 503);

  const estimatedInput = tokenCount(body.messages);
  const estimatedCostUsd = estimateCostUsd(estimatedInput, maxTokens, model);
  const idempotencyKey = request.headers.get('idempotency-key');
  const authorization = await authorizeRequest({
    userId: identity.userId,
    modelId: model.id,
    estimatedCostUsd,
    forexRate,
    idempotencyKey,
  });
  if (authorization.error || !authorization.data) {
    const code = authorization.error?.message.includes('INSUFFICIENT_BALANCE')
      ? 'INSUFFICIENT_BALANCE'
      : 'AUTHORIZATION_FAILED';
    return errorResponse(code, 'Unable to reserve quota', code === 'INSUFFICIENT_BALANCE' ? 402 : 500);
  }

  const upstreamUrl = process.env.UPSTREAM_CHAT_COMPLETIONS_URL;
  const upstreamKey = process.env.UPSTREAM_API_KEY;
  if (!upstreamUrl || !upstreamKey) {
    await finalizeRequest({ requestId: authorization.data, status: 'failed' });
    return errorResponse('UPSTREAM_ERROR', 'Upstream gateway is not configured', 502);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${upstreamKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    await finalizeRequest({ requestId: authorization.data, status: 'failed' });
    return errorResponse('UPSTREAM_TIMEOUT', 'Upstream did not respond', 504);
  }
  clearTimeout(timeout);

  if (!upstream.ok || !upstream.body) {
    await finalizeRequest({ requestId: authorization.data, status: 'failed' });
    return errorResponse('UPSTREAM_ERROR', 'Upstream request failed', 502);
  }

  if (body.stream) {
    const stream = new TransformStream<Uint8Array, Uint8Array>({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush() {
        await finalizeRequest({
          requestId: authorization.data!,
          status: 'completed',
          actualCostUsd: estimatedCostUsd,
          forexRate,
          inputTokens: estimatedInput,
          outputTokens: maxTokens,
        });
      },
    });
    upstream.body.pipeThrough(stream);
    return new Response(stream.readable, {
      status: 200,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' },
    });
  }

  const payload = await upstream.json().catch(() => null);
  const usage = extractUsage(payload);
  const actualCostUsd = estimateCostUsd(usage.input || estimatedInput, usage.output || maxTokens, model);
  const finalized = await finalizeRequest({
    requestId: authorization.data,
    status: 'completed',
    actualCostUsd,
    forexRate,
    inputTokens: usage.input || estimatedInput,
    outputTokens: usage.output || maxTokens,
  });
  if (finalized.error) return errorResponse('BILLING_FINALIZE_FAILED', 'Unable to finalize billing', 500);
  return NextResponse.json(payload, { status: 200 });
}
