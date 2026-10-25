import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function Markdown({ source, className, dark }: { source: string; className?: string; dark?: boolean }) {
  const html = renderMarkdown(source);
  if (!html) return null;
  return <div className={cn("prose-statlin", dark && "prose-dark", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
