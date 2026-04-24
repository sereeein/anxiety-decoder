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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAssistant
            ? 'bg-stone-100 text-stone-800'
            : 'bg-stone-800 text-stone-50'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
