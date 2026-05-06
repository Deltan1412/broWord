import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './EmailAuth.css';

interface EmailAuthProps {
  onSuccess?: () => void;
}

export function EmailAuth({ onSuccess }: EmailAuthProps) {
  const { signInWithPassword, signUp } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setShowVerificationWarning(true);
        return;
      } else {
        const { error: signInError } = await signInWithPassword(email, password);
        if (signInError) throw signInError;
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationWarning) {
    return (
      <div className="email-auth">
        <h2 className="email-auth__title">Check your email</h2>
        <div className="email-auth__success-msg" style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--color-fg-soft)' }}>
          We've sent a verification link to <strong>{email}</strong>. Please verify your email to continue.
        </div>
        <button 
          className="btn btn--primary email-auth__submit"
          onClick={() => {
            setShowVerificationWarning(false);
            setMode('signin');
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="email-auth">
      <h2 className="email-auth__title">
        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="email-auth__form">
        <div className="email-auth__field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="email-auth__field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {mode === 'signup' && (
          <div className="email-auth__field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        {mode === 'signin' && (
          <div className="email-auth__remember">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>
        )}

        {error && <div className="email-auth__error error">{error}</div>}

        <button 
          type="submit" 
          className="btn btn--primary email-auth__submit" 
          disabled={loading}
        >
          {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
        </button>
      </form>

      <div className="email-auth__toggle">
        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
        <button 
          type="button" 
          className="email-auth__toggle-btn"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
        >
          {mode === 'signin' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
