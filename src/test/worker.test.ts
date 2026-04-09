import { describe, expect, it, vi } from 'vitest';
import worker from '../../cloudflare/worker';

describe('cloudflare worker validation parity', () => {
  const env = {
    ASSETS: {
      fetch: vi.fn(async () => new Response('asset ok', { status: 200 })),
    },
  } as const;

  it('rejects search queries shorter than two characters', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/search?q=a'), env);
    expect(response.status).toBe(422);

    const body = (await response.json()) as { detail: Array<{ loc: string[]; type: string }> };
    expect(body.detail[0].loc).toEqual(['query', 'q']);
    expect(body.detail[0].type).toBe('string_too_short');
  });

  it('rejects rollout packet requests missing purpose', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/api/rollout-packet/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Finance Packet',
          audience: 'finance',
          body: 'Owner scope baseline kpi business case training communications support champion decision log geo language',
        }),
      }),
      env,
    );
    expect(response.status).toBe(422);

    const body = (await response.json()) as { detail: Array<{ loc: string[]; type: string }> };
    expect(body.detail[0].loc).toEqual(['body', 'purpose']);
    expect(body.detail[0].type).toBe('missing');
  });

  it('uses the backend default audience when plan requests omit it', async () => {
    const response = await worker.fetch(
      new Request('https://example.com/api/assistant/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: 'We need a detailed adoption plan for finance close with KPI tracking and readiness actions.',
        }),
      }),
      env,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as { recommended_program: string };
    expect(body.recommended_program).toBe('Finance Close Copilot Sprint');
  });
});
