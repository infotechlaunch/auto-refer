import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';

export default function CopyButton({ text, label = 'Copy', size = 'sm' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn btn-secondary btn-${size}`}
      style={{ minWidth: 72 }}
    >
      {copied ? (
        <>
          <Check size={14} />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} />
          {label}
        </>
      )}
    </button>
  );
}
