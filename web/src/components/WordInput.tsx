import { useState, type FormEvent, type KeyboardEvent } from "react";

const EXAMPLES = ["banana", "Chicago", "nostalgia", "first date"] as const;

interface WordInputProps {
  readonly busy: boolean;
  readonly onSubmit: (input: string) => void;
}

export function WordInput({ busy, onSubmit }: WordInputProps) {
  const [value, setValue] = useState("");
  const [composing, setComposing] = useState(false);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    onSubmit(value);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (composing || event.nativeEvent.isComposing)) event.preventDefault();
  };
  const useExample = (example: string) => {
    setValue(example);
    onSubmit(example);
  };

  return (
    <div className="input-cluster">
      <form className="word-form" onSubmit={submit}>
        <label htmlFor="word-input">What word are you wondering about?</label>
        <div className="input-row">
          <input
            id="word-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={onKeyDown}
            placeholder="A name, a place, a feeling…"
            maxLength={160}
            autoComplete="off"
            spellCheck="false"
          />
          <button className="submit-button" type="submit">
            {busy ? "Feeling…" : "Feel it"}
          </button>
        </div>
      </form>
      <div className="examples" aria-label="Example words">
        <span>Try</span>
        {EXAMPLES.map((example) => (
          <button key={example} type="button" onClick={() => useExample(example)}>{example}</button>
        ))}
      </div>
    </div>
  );
}
