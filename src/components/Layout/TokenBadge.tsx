import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
}

export function TokenBadge({ profile }: Props) {
  const limit = profile.daily_token_limit || 1;
  const remaining = Math.max(0, limit - profile.tokens_used);
  const pct = Math.min(100, (profile.tokens_used / limit) * 100);
  const title = `${profile.tokens_used.toLocaleString()} of ${limit.toLocaleString()} tokens used today`;

  return (
    <div className="token-badge" title={title}>
      <span className="token-badge__label">tokens</span>
      <div className="token-badge__track">
        <div className="token-badge__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="token-badge__count">{remaining.toLocaleString()}</span>
    </div>
  );
}
