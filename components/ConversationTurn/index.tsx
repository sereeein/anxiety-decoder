// components/ConversationTurn/index.tsx

interface ConversationTurnProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationTurn({ role, content }: ConversationTurnProps) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200 ${
          isAssistant
            ? 'bg-[var(--card-bg)] text-[var(--text)] border-2 border-[var(--card-border)]'
            : 'bg-[var(--accent-soft)] text-[var(--text)]'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
