import { describe, expect, test } from "bun:test";
import { CHAT_ATTACHMENT_MAX_BYTES, chatAttachmentMime } from "./chatAttachments";

describe("chat attachment restrictions", () => {
  test("maximum attachment size is 10MB", () => {
    expect(CHAT_ATTACHMENT_MAX_BYTES).toBe(10485760);
  });
  test("accepts supported images and generic files", () => {
    expect(chatAttachmentMime({ name: "photo.png", type: "image/png" })).toBe("image/png");
    expect(chatAttachmentMime({ name: "notes.txt", type: "" })).toBe("text/plain");
    expect(chatAttachmentMime({ name: "archive.zip", type: "application/octet-stream" })).toBe("application/zip");
  });
  test("rejects active HTML and SVG attachments", () => {
    expect(chatAttachmentMime({ name: "page.html", type: "text/html" })).toBeNull();
    expect(chatAttachmentMime({ name: "image.svg", type: "image/svg+xml" })).toBeNull();
  });
});