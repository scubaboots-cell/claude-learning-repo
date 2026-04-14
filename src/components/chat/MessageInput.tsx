"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef } from "react";
import { Send, Paperclip } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.md,.json,.csv"
        />
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-24 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2.5 rounded-lg transition-all hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-neutral-600" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
          >
            <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || !input.trim() ? 'text-neutral-300' : 'text-blue-600'}`} />
          </button>
        </div>
      </div>
    </form>
  );
}