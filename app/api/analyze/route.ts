import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { billText, insuranceType } = await request.json();

    if (!billText || typeof billText !== "string" || billText.trim().length === 0) {
      return Response.json(
        { error: "Bill text is required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a medical billing expert and patient advocate. You help patients understand their medical bills by explaining medical codes and charges in plain English. You know CPT codes, diagnosis codes, facility fees, and common billing practices. You flag charges that seem unusual, duplicated, or higher than typical rates. You help patients know what questions to ask.`;

    const userPrompt = `Analyze this medical bill for a patient with ${insuranceType || "unspecified"} insurance coverage. Return ONLY valid JSON with no markdown, no code fences, and no extra text.

Medical Bill:
${billText}

Return this exact JSON structure:
{
  "totalCharged": "$0.00",
  "summary": "Plain English summary of what this bill is for",
  "lineItems": [
    {
      "originalText": "the original line from the bill",
      "plainEnglish": "what this charge actually means in simple terms",
      "amount": "$0.00",
      "typicalRange": "$0-$0",
      "flag": null
    }
  ],
  "flags": [
    {
      "type": "OVERPRICED|DUPLICATE|UNUSUAL|VERIFY",
      "description": "What the flag means and why it was flagged",
      "lineItem": "Which line item this applies to"
    }
  ],
  "questionsToAsk": [
    "Specific question the patient should ask the billing department"
  ],
  "patientRights": [
    "A right the patient has regarding this bill"
  ],
  "nextSteps": "Concrete guidance on what the patient should do next"
}

Flag types:
- OVERPRICED: charge appears higher than typical rates for this service
- DUPLICATE: same service appears to be billed more than once
- UNUSUAL: charge seems unexpected or unrelated to the apparent reason for the visit
- VERIFY: patient should confirm this service was actually performed

If a line item has no flag, use null for the flag field. If the bill text is unclear or minimal, do your best to analyze what is provided and offer helpful guidance. Always include at least one entry in questionsToAsk and patientRights.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const rawContent = message.content[0];
    if (rawContent.type !== "text") {
      return Response.json(
        { error: "Unexpected response format from AI." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent.text);
    } catch {
      const jsonMatch = rawContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return Response.json(
          { error: "Failed to parse AI response as JSON." },
          { status: 500 }
        );
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("Error analyzing bill:", error);
    return Response.json(
      { error: "Failed to analyze the bill. Please try again." },
      { status: 500 }
    );
  }
}
