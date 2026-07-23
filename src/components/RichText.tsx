"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render assistant Markdown as styled rich text. react-markdown maps Markdown
 * to React elements (no raw HTML injection), so it's XSS-safe; Tailwind
 * arbitrary variants restyle the elements Preflight resets.
 */
export function RichText({ children }: { children: string }) {
  return (
    <div
      className={[
        "text-[14px] leading-relaxed",
        "[&_p]:my-1.5 first:[&_p]:mt-0 last:[&_p]:mb-0",
        "[&_ul]:my-1.5 [&_ul]:ml-4 [&_ul]:list-disc",
        "[&_ol]:my-1.5 [&_ol]:ml-4 [&_ol]:list-decimal",
        "[&_li]:my-0.5 [&_li]:pl-0.5",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_em]:italic",
        "[&_a]:font-medium [&_a]:text-brand [&_a]:underline",
        "[&_h1]:mb-1 [&_h1]:mt-2 [&_h1]:text-[15px] [&_h1]:font-bold",
        "[&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:text-[14px] [&_h2]:font-bold",
        "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-[13px] [&_h3]:font-semibold",
        "[&_code]:rounded [&_code]:bg-slate-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px]",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-2.5",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[12.5px] [&_pre_code]:text-slate-100",
        "[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-muted",
        "[&_hr]:my-3 [&_hr]:border-line",
        "[&_table]:my-2 [&_table]:block [&_table]:overflow-x-auto [&_table]:text-[13px]",
        "[&_th]:border [&_th]:border-line [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
