import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../../types';
import { TokenBadge } from './TokenBadge';

interface Props {
  user: User | null;
  profile: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Header({ user, profile, onSignIn, onSignOut }: Props) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo">broWord</span>
        <span className="header__tagline">read · simplify · learn</span>
      </div>
      <div className="header__actions">
        {user ? (
          <>
            {profile && <TokenBadge profile={profile} />}
            <span className="header__email">{user.email}</span>
            <button className="btn btn--ghost" onClick={onSignOut}>
              sign out
            </button>
          </>
        ) : (
          <button className="btn btn--primary" onClick={onSignIn}>
            sign in
          </button>
        )}
      </div>
    </header>
  );
}
