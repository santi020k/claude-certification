import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getApiBaseUrl,
  parseRetryAfter,
  readChatResponse,
  readChatStream,
  readErrorMessage,
} from "./api";

describe("getApiBaseUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.my-domain.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return the NEXT_PUBLIC_API_URL from environment", () => {
    expect(getApiBaseUrl()).toBe("https://api.my-domain.com");
  });

  it("should fallback to localhost if NEXT_PUBLIC_API_URL is not defined", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    // Delete from process.env to ensure fallback
    const prev = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe("http://localhost:8000");
    process.env.NEXT_PUBLIC_API_URL = prev;
  });
});

describe("readErrorMessage", () => {
  it("should parse and return the detail field if it is a string", async () => {
    const response = new Response(
      JSON.stringify({ detail: "Rate limit exceeded." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
    const message = await readErrorMessage(response);
    expect(message).toBe("Rate limit exceeded.");
  });

  it("should return standard fallback message if detail is missing", async () => {
    const response = new Response(JSON.stringify({ message: "Error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    const message = await readErrorMessage(response);
    expect(message).toBe("The API returned an unexpected response.");
  });

  it("should return standard fallback message if json parsing fails", async () => {
    const response = new Response("Invalid JSON", {
      status: 500,
    });
    const message = await readErrorMessage(response);
    expect(message).toBe("The API returned an unexpected response.");
  });
});

describe("parseRetryAfter", () => {
  it("should return 60 if Retry-After header is missing", () => {
    const response = new Response(null);
    expect(parseRetryAfter(response)).toBe(60);
  });

  it("should parse integer seconds correctly", () => {
    const response = new Response(null, {
      headers: { "Retry-After": "12" },
    });
    expect(parseRetryAfter(response)).toBe(12);
  });

  it("should handle negative or zero seconds by pinning to 1", () => {
    const response = new Response(null, {
      headers: { "Retry-After": "0" },
    });
    expect(parseRetryAfter(response)).toBe(1);

    const responseNegative = new Response(null, {
      headers: { "Retry-After": "-5" },
    });
    expect(parseRetryAfter(responseNegative)).toBe(1);
  });

  it("should parse date string correctly", () => {
    const futureTime = Date.now() + 30000; // 30 seconds from now
    const dateString = new Date(futureTime).toUTCString();
    const response = new Response(null, {
      headers: { "Retry-After": dateString },
    });
    const parsed = parseRetryAfter(response);
    // parsed should be around 30 seconds
    expect(parsed).toBeGreaterThanOrEqual(25);
    expect(parsed).toBeLessThanOrEqual(35);
  });

  it("should fallback to 60 if Retry-After is invalid", () => {
    const response = new Response(null, {
      headers: { "Retry-After": "invalid-date-or-number" },
    });
    expect(parseRetryAfter(response)).toBe(60);
  });
});

describe("readChatResponse", () => {
  it("should parse a valid chat payload", async () => {
    const response = new Response(
      JSON.stringify({
        conversation_id: "conversation-1",
        answer: "Hello.",
        messages: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello." },
        ],
        model: "test-model",
        input_tokens: 4,
        output_tokens: 2,
      }),
    );

    await expect(readChatResponse(response)).resolves.toMatchObject({
      conversation_id: "conversation-1",
      answer: "Hello.",
    });
  });

  it("should reject malformed chat payloads", async () => {
    const response = new Response(
      JSON.stringify({
        conversation_id: "conversation-1",
        answer: "Hello.",
        messages: [{ role: "system", content: "Nope" }],
        model: "test-model",
        input_tokens: 4,
        output_tokens: 2,
      }),
    );

    await expect(readChatResponse(response)).rejects.toThrow(
      "invalid chat payload",
    );
  });
});

describe("readChatStream", () => {
  it("should parse streamed chat events", async () => {
    const response = new Response(
      [
        JSON.stringify({ type: "text", text: "Hel" }),
        JSON.stringify({ type: "text", text: "lo" }),
        JSON.stringify({
          type: "final",
          conversation_id: "conversation-1",
          answer: "Hello",
          messages: [
            { role: "user", content: "Hi" },
            { role: "assistant", content: "Hello" },
          ],
          model: "test-model",
          input_tokens: 4,
          output_tokens: 2,
        }),
      ].join("\n"),
    );

    const events = [];
    for await (const event of readChatStream(response)) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ type: "text", text: "Hel" });
    expect(events[2]).toMatchObject({ type: "final", answer: "Hello" });
  });
});
