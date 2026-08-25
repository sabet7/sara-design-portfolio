import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { QA_TREE } from "@/lib/elieQA";

const CONTEXT_PATH = path.join(process.cwd(), "src/content/elie-context.md");

export async function POST(req: NextRequest) {
  let question: unknown;
  try {
    const body = await req.json();
    question = body.question;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof question !== "string" || !question.trim() || question.length > 500) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Elie isn't fully set up yet — missing ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }

  const bioText = fs.existsSync(CONTEXT_PATH) ? fs.readFileSync(CONTEXT_PATH, "utf8") : "";

  const qaText = Object.values(QA_TREE)
    .map((node) => `Q: ${node.question}\nA: ${node.answer}`)
    .join("\n\n");

  const systemPrompt = `You are "Elie," a friendly assistant answering questions about Sara del Villar for visitors to her design portfolio — mostly recruiters and hiring managers.

Answer ONLY using the information below. Keep answers warm, conversational, and concise (2-4 sentences) — this is a chat reply, not an essay.

If the question isn't covered by the information below, say honestly that you don't have that answer, and suggest the visitor try one of the suggested questions or reach out to Sara directly. Never invent facts about Sara that aren't stated below.

--- BACKGROUND (Sara's own words) ---
${bioText}

--- PREVIOUSLY WRITTEN ANSWERS ---
${qaText}`;

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the model." }, { status: 502 });
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic API error:", errText);
    return NextResponse.json({ error: "Something went wrong." }, { status: 502 });
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text ?? "I'm not sure how to answer that.";

  return NextResponse.json({ answer: text });
}
