import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders lesson/course/task descriptions (stored as markdown) with the app's own type styles instead of a generic prose plugin. */
export function Markdown({ content, className = "" }: { content: string; className?: string }) {
  if (!content) return null;

  return (
    <div className={`min-w-0 text-[15px] leading-relaxed text-foreground ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-6 border-b border-border pb-2 font-[family-name:var(--font-display)] text-xl font-extrabold first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 font-[family-name:var(--font-display)] text-lg font-bold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-[family-name:var(--font-display)] text-base font-bold first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-3 ml-1 flex flex-col gap-1.5 pl-4 [&_ul]:mt-1.5 [&_ol]:mt-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-1 flex list-decimal flex-col gap-1.5 pl-4 [&_ul]:mt-1.5 [&_ol]:mt-1.5">{children}</ol>,
          li: ({ children, className: liClassName }) => (
            <li className={`relative pl-1.5 marker:font-bold marker:text-primary ${liClassName ?? "list-disc"}`}>{children}</li>
          ),
          hr: () => <hr className="my-5 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-md border-l-4 border-primary/40 bg-primary-soft/40 py-2 pl-4 pr-3 text-foreground/90 italic">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = /language-/.test(codeClassName ?? "");
            if (isBlock) {
              return <code className={codeClassName}>{children}</code>;
            }
            return (
              <code className="rounded-md bg-surface-soft px-1.5 py-0.5 font-mono text-[13px] text-primary">{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-surface-soft p-3.5 font-mono text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[420px] border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-soft">{children}</thead>,
          th: ({ children }) => <th className="border-b border-border px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top">{children}</td>,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} className="mb-3 max-w-full rounded-md border border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
