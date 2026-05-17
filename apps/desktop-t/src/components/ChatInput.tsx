import React from "react";
import { Send, Fingerprint } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isGenerating: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isGenerating,
  textareaRef
}: ChatInputProps) {
  return (
    <div className="p-8 bg-gradient-to-t from-[#030407] via-[#030407] to-transparent">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }} 
        className="max-w-4xl mx-auto"
      >
        <div className="bg-[#0b0c12]/90 border border-white/[0.06] hover:border-white/[0.12] focus-within:border-violet-500/40 rounded-2xl p-4 flex flex-col gap-4 backdrop-blur-2xl transition-all duration-300 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            rows={1}
            placeholder="Ask RouteCode to analyze, refactor, or build systems securely..."
            className="w-full min-h-[44px] max-h-[180px] bg-transparent border-none outline-none resize-none text-[13.5px] text-[#f1f5f9] placeholder-gray-500 leading-relaxed px-1"
          />

          <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 px-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 tracking-wider uppercase">
                <Fingerprint className="w-3 h-3 text-emerald-400" /> Sandbox Locked
              </div>
            </div>

            <button
              type="submit"
              disabled={!value.trim() || isGenerating}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 shadow-md shadow-violet-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
