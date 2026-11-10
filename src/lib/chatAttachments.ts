export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
  "image/bmp", "image/tiff", "image/heic", "image/heif", "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain", "application/zip", "application/x-zip-compressed",
] as const;

export function chatAttachmentMime(file: { type: string; name: string }): string | null {
  if (CHAT_ATTACHMENT_MIME_TYPES.some(type => type === file.type)) return file.type;
  // Some browsers omit MIME types for these generic file formats.
  if (file.type && file.type !== "application/octet-stream") return null;
  const extensions: Record<string, string> = {
    pdf: "application/pdf", doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain", zip: "application/zip",
  };
  return extensions[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}