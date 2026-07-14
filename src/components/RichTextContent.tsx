"use client";

import { useMemo } from "react";
import { looksLikeHtml, sanitizeHtml } from "../lib/sanitizeHtml";

interface RichTextContentProps {
  html: string;
  className?: string;
}

/**
 * Renders product RTE fields (description / longDescription).
 * HTML from the admin editor is sanitized; plain text stays escaped.
 */
export default function RichTextContent({ html, className = "" }: RichTextContentProps) {
  const content = (html ?? "").trim();
  const isHtml = looksLikeHtml(content);
  const safeHtml = useMemo(
    () => (isHtml && content ? sanitizeHtml(content) : ""),
    [content, isHtml]
  );

  if (!content) return null;

  if (!isHtml) {
    return (
      <p className={`whitespace-pre-wrap ${className}`.trim()}>{content}</p>
    );
  }

  return (
    <div
      className={`rich-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
