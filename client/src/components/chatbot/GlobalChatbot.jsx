import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
    Bot,
    Loader2,
    Maximize2,
    MessageCircle,
    Minimize2,
    SendHorizontal,
    Sparkles,
    User,
    X,
} from "lucide-react";
import { useChatMutation } from "../../hooks/usePortfolioApi";
import { useToast } from "../../context/ToastContext";
import { chatbotQuerySchema } from "../../schemas/forms";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../lib/api";

const FALLBACK_MESSAGE = "I haven't added that yet, but working on it.";
const FRIENDLY_ERROR_MESSAGE =
    "I'm having a small issue right now. Please try again in a moment.";
const TOOLTIP_TEXTS = [
    "Explore more about me",
    "Quick About me",
    "Ask me",
    "Instant Access",
];
const TOOLTIP_ROTATION_MS = 3000;
const MOBILE_BREAKPOINT = 768;

const formatAnswer = (value) => {
    const cleaned = String(value || "")
        .replace(/\r/g, "")
        .trim();

    if (!cleaned) {
        return FALLBACK_MESSAGE;
    }

    const rawLines = cleaned.includes("\n")
        ? cleaned.split("\n")
        : cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];

    return rawLines
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 4)
        .map((line) => (line.length > 160 ? `${line.slice(0, 157)}...` : line))
        .join("\n");
};

const ChatMessage = ({ message, onRetry }) => {
    const isBot = message.role === "bot";

    return (
        <div
            className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"}`}
        >
            {isBot ? (
                <span className="mt-1 inline-flex rounded-full border border-zinc-800 bg-zinc-900 p-1">
                    <Bot className="h-3.5 w-3.5 text-zinc-400" />
                </span>
            ) : null}

            <div
                className={`max-w-[85%] rounded-lg border px-2.5 py-2 text-sm ${
                    isBot
                        ? "border-zinc-800 bg-zinc-900 text-zinc-300"
                        : "border-zinc-700 bg-zinc-100 text-zinc-950"
                }`}
            >
                {message.pending ? (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking...
                    </div>
                ) : (
                    <p
                        className={`whitespace-pre-line text-sm leading-relaxed ${isBot ? "text-zinc-300" : ""}`}
                    >
                        {message.content}
                    </p>
                )}

                {isBot && message.retryable ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 text-xs font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
                    >
                        Retry
                    </button>
                ) : null}
            </div>

            {!isBot ? (
                <span className="mt-1 inline-flex rounded-full border border-zinc-300 bg-zinc-100 p-1">
                    <User className="h-3.5 w-3.5 text-zinc-900" />
                </span>
            ) : null}
        </div>
    );
};

const ChatWindow = ({
    isMobile,
    isExpanded,
    isOpen,
    messages,
    input,
    isSending,
    chatContainerRef,
    onClose,
    onExpandToggle,
    onInputChange,
    onSubmit,
    onRetry,
}) => {
    if (!isOpen) {
        return null;
    }

    if (isMobile) {
        return (
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 z-[75] flex flex-col bg-zinc-950"
            >
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-3">
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                        <Sparkles className="h-4 w-4 text-zinc-400" />
                        Arif AI
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
                        aria-label="Close chatbot"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div
                    ref={chatContainerRef}
                    className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
                >
                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            onRetry={onRetry}
                        />
                    ))}
                </div>

                <form
                    onSubmit={onSubmit}
                    className="border-t border-zinc-800 px-3 py-3"
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={onInputChange}
                            placeholder="Ask about projects, skills..."
                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                        />
                        <button
                            type="submit"
                            disabled={isSending}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <SendHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </Motion.div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {isExpanded ? (
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[74] bg-black/70 backdrop-blur-[1px]"
                    />
                ) : null}
            </AnimatePresence>

            <Motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`fixed z-[75] overflow-hidden border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/60 ${
                    isExpanded
                        ? "left-1/2 top-1/2 h-[min(78vh,46rem)] w-[min(95vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl"
                        : "bottom-20 right-4 h-[30rem] w-[22rem] rounded-xl"
                }`}
            >
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
                    <button
                        type="button"
                        onClick={onExpandToggle}
                        className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
                        aria-label={
                            isExpanded ? "Minimize chatbot" : "Expand chatbot"
                        }
                    >
                        {isExpanded ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </button>
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                        <Sparkles className="h-4 w-4 text-zinc-400" />
                        Arif AI
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:text-zinc-200"
                        aria-label="Close chatbot"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div
                    ref={chatContainerRef}
                    className="h-[calc(100%-8.75rem)] space-y-3 overflow-y-auto px-3 py-3"
                >
                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            onRetry={onRetry}
                        />
                    ))}
                </div>

                <form
                    onSubmit={onSubmit}
                    className="border-t border-zinc-800 px-3 py-3"
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={onInputChange}
                            placeholder="Ask about projects, skills..."
                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                        />
                        <button
                            type="submit"
                            disabled={isSending}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <SendHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </Motion.div>
        </>
    );
};

const GlobalChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [tooltipIndex, setTooltipIndex] = useState(0);
    const [isTooltipPaused, setIsTooltipPaused] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "bot",
            content:
                "Hey, I'm Arif. Ask me about my projects, experience, skills, or certifications.",
            pending: false,
            retryable: false,
        },
    ]);

    const chatMutation = useChatMutation();
    const toast = useToast();
    const chatContainerRef = useRef(null);
    const lastFailedQueryRef = useRef("");
    const messageIdRef = useRef(1);
    const debouncedInput = useDebouncedValue(input, 180);

    useEffect(() => {
        const updateViewport = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => {
            window.removeEventListener("resize", updateViewport);
        };
    }, []);

    useEffect(() => {
        if (isTooltipPaused || isOpen) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setTooltipIndex((index) => (index + 1) % TOOLTIP_TEXTS.length);
        }, TOOLTIP_ROTATION_MS);

        return () => window.clearInterval(intervalId);
    }, [isOpen, isTooltipPaused]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }, [messages, isOpen]);

    const closeWindow = () => {
        setIsOpen(false);
        setIsExpanded(false);
    };

    const sendMessage = async (rawValue) => {
        const query = rawValue.trim();
        const validation = chatbotQuerySchema.safeParse({ query });

        if (!validation.success) {
            toast.warning(
                validation.error.issues[0]?.message || "Query is invalid",
                "Validation",
            );
            return;
        }

        messageIdRef.current += 1;
        const userId = messageIdRef.current;
        messageIdRef.current += 1;
        const pendingId = messageIdRef.current;

        // Track chatbot interaction 
        try {
            api.post('/analytics/event', {
                page: window.location.pathname,
                type: 'chatbot',
                delta: 1
            });
        } catch (err) {
            // Silently fail telemetry
        }

        setMessages((previous) => [
            ...previous,
            {
                id: userId,
                role: "user",
                content: query,
                pending: false,
                retryable: false,
            },
            {
                id: pendingId,
                role: "bot",
                content: "",
                pending: true,
                retryable: false,
            },
        ]);
        setInput("");

        const toastId = toast.loading("Arif is typing...");

        try {
            const response = await chatMutation.mutateAsync({ query });
            const rawAnswer = response?.item?.answer || FALLBACK_MESSAGE;
            const isFallback = rawAnswer.trim() === FALLBACK_MESSAGE;
            const answer = isFallback
                ? FALLBACK_MESSAGE
                : formatAnswer(rawAnswer);

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === pendingId
                        ? {
                              ...message,
                              content: answer || FALLBACK_MESSAGE,
                              pending: false,
                              retryable: false,
                          }
                        : message,
                ),
            );

            toast.update(toastId, {
                type: isFallback ? "warning" : "success",
                title: isFallback ? "Limited Context" : "Answer Ready",
                message: isFallback
                    ? "I have limited details for this right now."
                    : "Reply generated in Arif persona.",
                persistent: false,
            });
        } catch (error) {
            const statusCode = error?.response?.status;
            const retryAfter = error?.response?.data?.retryAfter || 10;
            lastFailedQueryRef.current = query;

            setMessages((previous) =>
                previous.map((message) =>
                    message.id === pendingId
                        ? {
                              ...message,
                              content:
                                  statusCode === 429
                                      ? `Rate limit reached. Retry in ${retryAfter}s.`
                                      : FRIENDLY_ERROR_MESSAGE,
                              pending: false,
                              retryable: true,
                          }
                        : message,
                ),
            );

            toast.update(toastId, {
                type: statusCode === 429 ? "warning" : "error",
                title: statusCode === 429 ? "Rate Limited" : "Chat Failed",
                message:
                    statusCode === 429
                        ? `Retry after ${retryAfter}s.`
                        : getErrorMessage(error),
                actionLabel: "Retry",
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
        <>
            <div
                className="fixed bottom-3 right-3 z-[76] sm:bottom-4 sm:right-4"
                onMouseEnter={() => setIsTooltipPaused(true)}
                onMouseLeave={() => setIsTooltipPaused(false)}
            >
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-lg shadow-zinc-700/25 transition-colors hover:bg-zinc-800"
                    aria-label="Open AI chatbot"
                >
                    <MessageCircle className="h-4 w-4" />
                </button>
            </div>

            <AnimatePresence>
                {!isOpen && (
                    <Motion.div
                        key={TOOLTIP_TEXTS[tooltipIndex]}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed bottom-16 right-3 z-[75] sm:right-4 max-w-40 rounded-md border border-zinc-800 bg-zinc-950/95 px-2.5 py-1.5 text-sm text-zinc-300 shadow-lg shadow-black/60"
                    >
                        {TOOLTIP_TEXTS[tooltipIndex]}
                    </Motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                <ChatWindow
                    isOpen={isOpen}
                    isExpanded={isExpanded}
                    isMobile={isMobile}
                    messages={messages}
                    input={input}
                    isSending={chatMutation.isPending}
                    chatContainerRef={chatContainerRef}
                    onClose={closeWindow}
                    onExpandToggle={() => setIsExpanded((value) => !value)}
                    onInputChange={(event) => setInput(event.target.value)}
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendMessage(debouncedInput || input);
                    }}
                    onRetry={() => {
                        if (lastFailedQueryRef.current) {
                            sendMessage(lastFailedQueryRef.current);
                        }
                    }}
                />
            </AnimatePresence>
        </>
    );
};

export default memo(GlobalChatbot);
