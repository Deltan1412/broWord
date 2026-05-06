import type { ChangeEvent } from 'react';

const MAX_WORDS = 250;
const MIN_WORDS = 5;

interface Props {
  value: string;
  onChange: (text: string) => void;
  onNext: () => void;
  disabled?: boolean;
}

export function ParagraphInput({ value, onChange, onNext, disabled }: Props) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = wordCount > MAX_WORDS;
  const tooShort = wordCount < MIN_WORDS;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);

  return (
    <section className="paragraph-input">
      <label className="paragraph-input__label" htmlFor="paragraph">
        paste a paragraph
      </label>
      <textarea
        id="paragraph"
        className="paragraph-input__textarea"
        value={value}
        onChange={handleChange}
        placeholder="paste up to 250 words. when you're done, click next to pick the words you don't know."
        rows={10}
        disabled={disabled}
        spellCheck={false}
      />
      <div className="paragraph-input__footer">
        <span
          className={`paragraph-input__count ${overLimit ? 'paragraph-input__count--error' : ''}`}
        >
          {wordCount} / {MAX_WORDS}
        </span>
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={disabled || overLimit || tooShort}
        >
          next
        </button>
      </div>
    </section>
  );
}
