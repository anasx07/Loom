import React from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Cpu 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  sender: "user" | "assistant" | "system-success" | "system-error";
  text: string;
  model?: string;
  thought?: string;
  isStreaming?: boolean;
}

interface ChatAreaProps {
  messages: Message[];
  expandedThoughts: Record<string, boolean>;
  onToggleThought: (id: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatArea({
  messages,
  expandedThoughts,
  onToggleThought,
  messagesEndRef
}: ChatAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
      {messages.map(msg => {
        const isUser = msg.sender === "user";
        const isSuccess = msg.sender === "system-success";
        const isError = msg.sender === "system-error";

        if (isSuccess) {
          return (
            <div key={msg.id} className="self-start max-w-[85%] animate-fade-slide">
              <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/5 border border-emerald-500/20 text-[#a7f3d0] rounded-2xl">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wide">{msg.text}</span>
              </div>
            </div>
          );
        }

        if (isError) {
          return (
            <div key={msg.id} className="self-start max-w-[85%] animate-fade-slide">
              <div className="flex items-center gap-3 px-5 py-4 bg-rose-500/5 border border-rose-500/20 text-[#fecaca] rounded-2xl">
                <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                <span className="text-xs font-bold font-mono tracking-wide">{msg.text}</span>
              </div>
            </div>
          );
        }

        return (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-2 max-w-[80%] animate-fade-slide ${
              isUser ? "self-end items-end" : "self-start items-start"
            }`}
          >
            {/* Bubble Sender Label */}
            <div className="flex items-center gap-2 px-1">
              {isUser ? (
                <>
                  <span className="text-[10px] font-black text-[#d946ef] uppercase tracking-widest">You</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d946ef] shadow-[0_0_6px_#d946ef]" />
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
                    RouteCode Core {msg.model && `(${msg.model})`}
                  </span>
                </>
              )}
            </div>

            {/* Bubble Container */}
            <div className={`px-6 py-5 rounded-3xl text-[13.5px] leading-relaxed border shadow-xl ${
              isUser 
                ? "bg-[#0d0e15]/80 border-[#d946ef]/20 text-[#fdf4ff] rounded-tr-sm shadow-[#d946ef]/2 whitespace-pre-wrap"
                : "bg-[#0b0c13]/60 border-white/[0.04] text-[#e2e8f0] rounded-tl-sm shadow-black/20"
            }`}>
              {/* Collapsible Thoughts Block */}
              {msg.thought && (
                <div className="mb-4 border border-amber-500/15 rounded-2xl overflow-hidden bg-amber-500/[0.01]">
                  <div 
                    onClick={() => onToggleThought(msg.id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-amber-500/[0.03] text-amber-400/90 text-xs font-extrabold gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                      💡 Reasoning Chain
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 text-amber-500/80 transition-transform duration-300 ${
                      expandedThoughts[msg.id] ? "rotate-90" : ""
                    }`} />
                  </div>
                  
                  {expandedThoughts[msg.id] && (
                    <div className="px-4 pb-4 pt-2.5 border-t border-amber-500/10 text-[11.5px] text-amber-400/60 font-mono leading-relaxed bg-black/10 whitespace-pre-wrap">
                      {msg.thought}
                    </div>
                  )}
                </div>
              )}

              {isUser ? (
                msg.text
              ) : (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Pass-through for pre
                    pre: ({ node, ...props }) => <>{props.children}</>,
                    // Custom code styling
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      
                      if (isInline) {
                        return (
                          <code className="rounded bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-violet-300" {...props}>
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="relative my-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#07080d] shadow-2xl">
                          <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#0b0c13] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-400">
                            <span>{match ? match[1] : "code"}</span>
                          </div>
                          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-gray-200">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    },
                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-300" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 pl-6 list-disc space-y-1.5 text-gray-300" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-4 pl-6 list-decimal space-y-1.5 text-gray-300" {...props} />,
                    li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="mt-6 mb-4 text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="mt-5 mb-3 text-lg font-bold tracking-tight text-gray-100" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="mt-4 mb-2 text-base font-semibold text-gray-200" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-gray-300" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="my-4 border-l-4 border-violet-500/50 bg-white/[0.02] py-2 pl-4 pr-3 text-gray-400 rounded-r-lg italic" {...props} />,
                    a: ({ node, ...props }) => <a className="text-[#c084fc] hover:text-[#d946ef] transition-colors underline decoration-dotted font-medium cursor-pointer" target="_blank" rel="noopener noreferrer" {...props} />,
                    table: ({ node, ...props }) => (
                      <div className="my-6 w-full overflow-x-auto rounded-xl border border-white/[0.08] bg-black/20 backdrop-blur-md">
                        <table className="w-full border-collapse text-left text-sm text-gray-200" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-violet-300" {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="px-6 py-4 font-semibold border-r border-white/[0.04] last:border-r-0" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="px-6 py-3.5 border-r border-white/[0.04] last:border-r-0 text-gray-300 font-normal" {...props} />
                    )
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
