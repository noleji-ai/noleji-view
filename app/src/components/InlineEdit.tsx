import React, { useState, useEffect, useRef } from 'react';

interface InlineEditProps {
  value: string;
  onConfirm: (newValue: string) => void;
  className?: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

export default function InlineEdit({
  value,
  onConfirm,
  className = '',
  isEditing,
  onStartEdit,
  onCancelEdit,
}: InlineEditProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Sync draft when value changes externally */
  useEffect(() => {
    setDraft(value);
  }, [value]);

  /* Auto-focus and select all when entering edit mode */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const confirmEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onConfirm(trimmed);
    } else {
      setDraft(value);
    }
    onCancelEdit();
  };

  const cancelEdit = () => {
    setDraft(value);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (!isEditing) {
    return (
      <span
        className={`cursor-default select-none ${className}`}
        onDoubleClick={onStartEdit}
        title="더블클릭하여 편집"
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={confirmEdit}
      className={`bg-transparent border-0 border-b border-[#10B981] outline-none px-0 py-0 ${className}`}
      style={{ width: `${Math.max(draft.length, 1)}ch` }}
    />
  );
}
