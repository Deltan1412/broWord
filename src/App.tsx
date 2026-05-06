import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useProcess } from './hooks/useProcess';
import { Header } from './components/Layout/Header';
import { ParagraphInput } from './components/Paragraph/ParagraphInput';
import { WordSelector } from './components/Paragraph/WordSelector';
import { ResultDisplay } from './components/Result/ResultDisplay';
import type { ProcessResult } from './types';
import './App.css';

type Stage = 'input' | 'select' | 'result';

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile(user?.id);
  const { process, loading: processing, error } = useProcess();

  const [stage, setStage] = useState<Stage>('input');
  const [paragraph, setParagraph] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ProcessResult | null>(null);

  const toggleWord = (word: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  const handleNext = () => {
    setSelected(new Set());
    setStage('select');
  };

  const handleProcess = async () => {
    const response = await process(paragraph.trim(), Array.from(selected));
    if (response) {
      setResult(response.result);
      setStage('result');
      refreshProfile();
    }
  };

  const handleReset = () => {
    setStage('input');
    setParagraph('');
    setSelected(new Set());
    setResult(null);
  };

  if (authLoading) {
    return (
      <div className="app">
        <div className="loader">loading…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        user={user}
        profile={profile}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
      <main className="app__main">
        {!user ? (
          <div className="welcome">
            <h1 className="welcome__title">read better. one word at a time.</h1>
            <p className="welcome__subtitle">
              paste a paragraph, click the words you don't know, and read it again — simpler.
            </p>
            <button className="btn btn--primary btn--large" onClick={signInWithGoogle}>
              sign in with Google
            </button>
          </div>
        ) : (
          <>
            {stage === 'input' && (
              <ParagraphInput
                value={paragraph}
                onChange={setParagraph}
                onNext={handleNext}
                disabled={processing}
              />
            )}
            {stage === 'select' && (
              <WordSelector
                paragraph={paragraph}
                selected={selected}
                onToggle={toggleWord}
                onProcess={handleProcess}
                onBack={() => setStage('input')}
                disabled={processing}
              />
            )}
            {stage === 'result' && result && (
              <ResultDisplay
                result={result}
                originalParagraph={paragraph}
                onReset={handleReset}
              />
            )}
            {error && <div className="error">{error}</div>}
          </>
        )}
      </main>
      <footer className="app__footer">
        <span>broWord — minimal english reader</span>
      </footer>
    </div>
  );
}
