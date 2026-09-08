import 'server-only';

/**
 * Cron auth guard. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
 * Rejects any request without the correct secret so cron endpoints can't be
 * triggered publicly.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}
