import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Copy, Loader2, Mic, Paperclip, Send, Sparkles, Square, User, Volume2, X } from "lucide-react";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

/**
 * Message type matching server-side LLM Message interface
 */
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIChatBoxProps = {
  /**
   * Messages array to display in the chat.
   * Should match the format used by invokeLLM on the server.
   */
  messages: Message[];

  /**
   * Callback when user sends a message.
   * Typically you'll call a tRPC mutation here to invoke the LLM.
   */
  onSendMessage: (content: string) => void;

  /**
   * Whether the AI is currently generating a response
   */
  isLoading?: boolean;

  /**
   * Placeholder text for the input field
   */
  placeholder?: string;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Height of the chat box (default: 600px)
   */
  height?: string | number;

  /**
   * Empty state message to display when no messages
   */
  emptyStateMessage?: string;

  /**
   * Suggested prompts to display in empty state
   * Click to send directly
   */
  suggestedPrompts?: string[];
  voiceState?: "idle" | "recording" | "transcribing" | "unavailable";
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onInputChange?: (content: string) => void;
  activeIntent?: string;
  intents?: { id: string; label: string; description: string }[];
  onIntentChange?: (intent: string) => void;
  stagedAttachments?: { name: string; size: number }[];
  onStageAttachments?: (files: File[]) => void;
  onRemoveAttachment?: (name: string) => void;
  onSpeakMessage?: (content: string) => void;
};

/**
 * A ready-to-use AI chat box component that integrates with the LLM system.
 *
 * Features:
 * - Matches server-side Message interface for seamless integration
 * - Markdown rendering with Streamdown
 * - Auto-scrolls to latest message
 * - Loading states
 * - Uses global theme colors from index.css
 *
 * @example
 * ```tsx
 * const ChatPage = () => {
 *   const [messages, setMessages] = useState<Message[]>([
 *     { role: "system", content: "You are a helpful assistant." }
 *   ]);
 *
 *   const chatMutation = trpc.ai.chat.useMutation({
 *     onSuccess: (response) => {
 *       // Assuming your tRPC endpoint returns the AI response as a string
 *       setMessages(prev => [...prev, {
 *         role: "assistant",
 *         content: response
 *       }]);
 *     },
 *     onError: (error) => {
 *       console.error("Chat error:", error);
 *       // Optionally show error message to user
 *     }
 *   });
 *
 *   const handleSend = (content: string) => {
 *     const newMessages = [...messages, { role: "user", content }];
 *     setMessages(newMessages);
 *     chatMutation.mutate({ messages: newMessages });
 *   };
 *
 *   return (
 *     <AIChatBox
 *       messages={messages}
 *       onSendMessage={handleSend}
 *       isLoading={chatMutation.isPending}
 *       suggestedPrompts={[
 *         "Explain quantum computing",
 *         "Write a hello world in Python"
 *       ]}
 *     />
 *   );
 * };
 * ```
 */
export function AIChatBox({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  height = "600px",
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
  voiceState = "idle",
  onVoiceStart,
  onVoiceStop,
  onInputChange,
  activeIntent,
  intents = [],
  onIntentChange,
  stagedAttachments = [],
  onStageAttachments,
  onRemoveAttachment,
  onSpeakMessage,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Filter out system messages
  const displayMessages = messages.filter((msg) => msg.role !== "system");

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const viewport = scrollAreaRef.current;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior
        });
      });
    }
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInput("");
    onInputChange?.("");

    // Scroll immediately after sending
    scrollToBottom();

    // Keep focus on input
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(index);
      window.setTimeout(() => setCopiedMessage((current) => current === index ? null : current), 1600);
    } catch {
      setCopiedMessage(null);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-slate-950/70 text-card-foreground",
        className
      )}
      style={{ height }}
    >
      {/* Messages Area */}
      <div ref={scrollAreaRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" aria-label="Jarvis conversation transcript">
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="size-12 text-cyan-200/30" />
                <p className="text-sm text-slate-400">{emptyStateMessage}</p>
              </div>

              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isLoading}
                      className="rounded-sm border border-cyan-300/15 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 transition-all duration-150 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-full flex-col space-y-5 p-5">
              {displayMessages.map((message, index) => {
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user"
                        ? "justify-end items-start"
                        : "justify-start items-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10">
                        <Sparkles className="size-4 text-cyan-200" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "group relative max-w-[84%] rounded-sm px-4 py-3 text-sm leading-6",
                        message.role === "user"
                          ? "border border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-50"
                          : "border border-cyan-300/15 bg-slate-900/75 text-slate-200"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none pr-14">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                          <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                            <button type="button" aria-label="Copy Jarvis response" onClick={() => void copyMessage(message.content, index)} className="flex size-7 items-center justify-center rounded-sm border border-white/10 bg-black/25 text-slate-400 transition hover:border-cyan-300/35 hover:text-cyan-100">
                              {copiedMessage === index ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                            </button>
                            {onSpeakMessage && <button type="button" aria-label="Replay Jarvis response" title="Replay Jarvis response" onClick={() => onSpeakMessage(message.content)} className="flex size-7 items-center justify-center rounded-sm border border-white/10 bg-black/25 text-slate-400 transition hover:border-fuchsia-400/35 hover:text-fuchsia-100"><Volume2 className="size-3.5" /></button>}
                          </div>
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10">
                        <User className="size-4 text-fuchsia-200" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10">
                    <Sparkles className="size-4 text-cyan-200" />
                  </div>
                  <div className="rounded-sm border border-cyan-300/15 bg-slate-900/75 px-4 py-3">
                    <Loader2 className="size-4 animate-spin text-cyan-200" />
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="z-10 shrink-0 border-t border-cyan-300/15 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(2,6,23,0.5)] backdrop-blur-xl"
      >
        {intents.length > 0 && <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Jarvis work mode">{intents.map((intent) => <button type="button" key={intent.id} aria-pressed={activeIntent === intent.id} title={intent.description} onClick={() => onIntentChange?.(intent.id)} className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] transition", activeIntent === intent.id ? "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100" : "border-white/10 bg-white/[0.025] text-slate-500 hover:border-cyan-300/30 hover:text-cyan-100")}>{intent.label}</button>)}</div>}
        {stagedAttachments.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{stagedAttachments.map((file) => <span className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-cyan-300/20 bg-cyan-300/[0.05] px-2 py-1 text-[10px] text-cyan-50" key={file.name}><Paperclip className="size-3 shrink-0" /><span className="max-w-32 truncate">{file.name}</span><span className="text-slate-500">{formatFileSize(file.size)}</span>{onRemoveAttachment && <button aria-label={`Remove ${file.name}`} type="button" onClick={() => onRemoveAttachment(file.name)} className="text-cyan-100 hover:text-white"><X className="size-3" /></button>}</span>)}</div>}
        <div className="flex items-end gap-2">
          <input ref={attachmentInputRef} onChange={(event) => { const files = Array.from(event.target.files ?? []); if (files.length) onStageAttachments?.(files); event.currentTarget.value = ""; }} type="file" multiple className="sr-only" aria-label="Stage files as local work context" />
          {onStageAttachments && <button type="button" onClick={() => attachmentInputRef.current?.click()} aria-label="Stage local work context" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/[0.025] text-slate-400 transition hover:border-cyan-300/35 hover:text-cyan-100"><Paperclip className="size-4" /></button>}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              onInputChange?.(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-10 max-h-32 flex-1 resize-none rounded-sm border-cyan-300/20 bg-slate-900/80 text-slate-100 placeholder:text-slate-600 focus-visible:border-cyan-300/55 focus-visible:ring-cyan-300/20"
            rows={1}
          />
          {onVoiceStart && onVoiceStop && (
            <button
              type="button"
              aria-label={voiceState === "recording" ? "Release to send voice command" : voiceState === "transcribing" ? "Transcribing voice command" : "Hold to talk to Jarvis"}
              aria-busy={voiceState === "transcribing"}
              onPointerDown={onVoiceStart}
              onPointerUp={onVoiceStop}
              onPointerLeave={() => voiceState === "recording" && onVoiceStop()}
              disabled={voiceState === "unavailable" || isLoading}
              className={cn("voice-command-button", voiceState === "recording" && "voice-command-button--recording", voiceState === "transcribing" && "voice-command-button--transcribing")}
            >
              {voiceState === "recording" ? <Square className="size-3.5 fill-current" /> : voiceState === "transcribing" ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 transition-all duration-150 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.97]"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
        {onStageAttachments && <p className="mt-2 text-[10px] leading-4 text-slate-600">Local context is staged in this browser only. Jarvis does not upload or read file contents until a reviewed upload flow is connected.</p>}
      </form>
    </div>
  );
}
