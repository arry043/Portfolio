import { memo, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, SendHorizontal, User } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SectionHeader from '../common/SectionHeader';
import { chatbotQuerySchema } from '../../schemas/forms';
import { useChatMutation } from '../../hooks/usePortfolioApi';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/api';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

const FALLBACK_MESSAGE = "I haven't added that yet, but working on it.";
const FRIENDLY_ERROR_MESSAGE =
  "I'm having a small issue right now. Please try again in a moment.";

const ChatBubble = ({ message }) => {
  const isBot = message.role === 'bot';

  return (
    <div className={`flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot ? (
        <div className="mt-1 rounded-full border border-zinc-800 bg-zinc-900 p-1 text-zinc-400">
          <Bot className="h-3.5 w-3.5" />
        </div>
      ) : null}

      <div
        className={`max-w-[85%] rounded-lg border px-3 py-2 text-sm ${
          isBot
            ? 'border-zinc-800 bg-zinc-900 text-zinc-300'
            : 'border-zinc-700 bg-zinc-100 text-zinc-950'
        }`}
      >
        {message.pending ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        ) : isBot ? (
          <p className="text-sm leading-relaxed text-zinc-300">{message.content}</p>
        ) : (
          <p className="text-sm leading-relaxed">{message.content}</p>
        )}
      </div>

      {!isBot ? (
        <div className="mt-1 rounded-full border border-zinc-300 bg-zinc-100 p-1 text-zinc-900">
          <User className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  );
};

const AIChatbotSection = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      content: "Hey, I'm Arif. Ask me about my skills, projects, or experience.",
      pending: false,
    },
  ]);

  const chatMutation = useChatMutation();
  const toast = useToast();
  const { trackClick } = useTrackSectionView('ai-chatbot');
  const chatContainerRef = useRef(null);
  const lastFailedQueryRef = useRef('');
  const messageIdRef = useRef(1);
  const debouncedInput = useDebouncedValue(input, 200);

  useEffect(() => {
    const node = chatContainerRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [messages]);

  const sendMessage = async (rawQuery) => {
    const query = rawQuery.trim();
    const validation = chatbotQuerySchema.safeParse({ query });

    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Invalid query', 'Validation');
      return;
    }

    trackClick();

    messageIdRef.current += 1;
    const userMessageId = messageIdRef.current;
    messageIdRef.current += 1;
    const pendingMessageId = messageIdRef.current;

    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      pending: false,
    };

    const placeholderMessage = {
      id: pendingMessageId,
      role: 'bot',
      content: '',
      pending: true,
    };

    setMessages((previous) => [...previous, userMessage, placeholderMessage]);
    setInput('');

    const loadingToastId = toast.loading('Arif is typing...');

    try {
      const response = await chatMutation.mutateAsync({ query });
      const answer = response?.item?.answer?.trim() || FALLBACK_MESSAGE;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === pendingMessageId
            ? { ...message, content: answer, pending: false }
            : message
        )
      );

      toast.update(loadingToastId, {
        type: answer === FALLBACK_MESSAGE ? 'warning' : 'success',
        title: answer === FALLBACK_MESSAGE ? 'Limited Context' : 'Answer Ready',
        message:
          answer === FALLBACK_MESSAGE
            ? 'No precise context found for this query in the indexed resume.'
            : 'Response generated from resume context.',
        persistent: false,
      });
    } catch (error) {
      const statusCode = error?.response?.status;
      const retryAfter = error?.response?.data?.retryAfter;
      lastFailedQueryRef.current = query;

      setMessages((previous) =>
        previous.map((message) =>
          message.id === pendingMessageId
            ? {
                ...message,
                content:
                  statusCode === 429
                    ? `Rate limit reached. Retry in ${retryAfter || 10}s.`
                    : FRIENDLY_ERROR_MESSAGE,
                pending: false,
              }
            : message
        )
      );

      toast.update(loadingToastId, {
        type: statusCode === 429 ? 'warning' : 'error',
        title: statusCode === 429 ? 'Rate Limited' : 'AI Request Failed',
        message:
          statusCode === 429
            ? `Please retry after ${retryAfter || 10}s.`
            : getErrorMessage(error),
        actionLabel: 'Retry',
        onAction: () => {
          if (lastFailedQueryRef.current) {
            sendMessage(lastFailedQueryRef.current);
          }
        },
        persistent: false,
      });
    }
  };

  return (
    <SectionWrapper id="ai" bgVariant="primary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="AI Chatbot"
            title="Resume-Aware Assistant"
            description="Ask targeted questions and get context-grounded answers from indexed resume knowledge."
          />

          <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
            <div
              ref={chatContainerRef}
              className="h-72 space-y-3 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/80 p-3"
            >
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(debouncedInput);
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about projects, skills, or experience..."
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
              />
              <Button type="submit" variant="secondary" className="gap-1.5">
                <SendHorizontal className="h-4 w-4" />
                Ask
              </Button>
            </form>
          </Card>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(AIChatbotSection);
