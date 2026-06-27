"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FlagType = "OVERPRICED" | "DUPLICATE" | "UNUSUAL" | "VERIFY" | null;

type LineItem = {
  originalText: string;
  plainEnglish: string;
  amount: string;
  typicalRange: string;
  flag: FlagType;
};

type Flag = {
  type: "OVERPRICED" | "DUPLICATE" | "UNUSUAL" | "VERIFY";
  description: string;
  lineItem: string;
};

type AnalysisResult = {
  totalCharged: string;
  summary: string;
  lineItems: LineItem[];
  flags: Flag[];
  questionsToAsk: string[];
  patientRights: string[];
  nextSteps: string;
};

const INSURANCE_OPTIONS = [
  { value: "uninsured", label: "Uninsured / Self-Pay" },
  { value: "private", label: "Private Insurance" },
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "other", label: "Other" },
];

function flagVariant(type: FlagType): "destructive" | "secondary" | "outline" {
  if (type === "OVERPRICED" || type === "DUPLICATE") return "destructive";
  if (type === "UNUSUAL" || type === "VERIFY") return "secondary";
  return "outline";
}

function flagLabel(type: FlagType): string {
  switch (type) {
    case "OVERPRICED":
      return "Possibly Overpriced";
    case "DUPLICATE":
      return "Possible Duplicate";
    case "UNUSUAL":
      return "Unusual Charge";
    case "VERIFY":
      return "Verify This";
    default:
      return "";
  }
}

export default function Home() {
  const [billText, setBillText] = useState("");
  const [insuranceType, setInsuranceType] = useState("uninsured");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!billText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billText, insuranceType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Medical Bill Explainer
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Understand your medical bill in plain English — decode charges, spot
          issues, and know exactly what to ask your billing department.
        </p>
        <p className="text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 inline-block">
          This tool helps you understand your bill. Always consult with your
          provider for official explanations.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-800">
            Enter Your Bill Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="insurance"
                className="block text-sm font-medium text-slate-700"
              >
                Insurance Type
              </label>
              <select
                id="insurance"
                value={insuranceType}
                onChange={(e) => setInsuranceType(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {INSURANCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="bill"
                className="block text-sm font-medium text-slate-700"
              >
                Paste Your Medical Bill
              </label>
              <textarea
                id="bill"
                value={billText}
                onChange={(e) => setBillText(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
                placeholder={`Paste your medical bill here. You can include:
- CPT codes and charges
- Description of services
- Diagnosis codes
- Any line items from your bill

Example:
Office Visit 99213 - $150.00
Lab Work 80053 - $95.00
Facility Fee - $200.00`}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !billText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing your bill...
                </span>
              ) : (
                "Decode My Bill"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide font-medium mb-1">
                Total Charged
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {result.totalCharged}
              </p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-700">
                What This Bill Is For
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-800 leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Line-by-Line Breakdown
            </h2>
            <div className="space-y-3">
              {result.lineItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="text-xs font-mono text-slate-400 break-all">
                      {item.originalText}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-base font-semibold text-slate-900">
                        {item.amount}
                      </span>
                      {item.flag && (
                        <Badge variant={flagVariant(item.flag)} className="text-xs">
                          {flagLabel(item.flag)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-800">{item.plainEnglish}</p>
                  {item.typicalRange && (
                    <p className="text-xs text-slate-500">
                      Typical range:{" "}
                      <span className="font-medium text-slate-600">
                        {item.typicalRange}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {result.flags && result.flags.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">
                Items to Review
              </h2>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
                {result.flags.map((flag, i) => (
                  <div key={i} className="flex gap-3">
                    <Badge
                      variant={
                        flag.type === "OVERPRICED" || flag.type === "DUPLICATE"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs self-start mt-0.5 flex-shrink-0"
                    >
                      {flagLabel(flag.type)}
                    </Badge>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-800">
                        {flag.lineItem}
                      </p>
                      <p className="text-sm text-slate-600">{flag.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-2" />

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Questions to Ask Your Billing Department
            </h2>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-5">
                <ol className="space-y-3">
                  {result.questionsToAsk.map((q, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-800 leading-relaxed pt-0.5">
                        {q}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <Accordion className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <AccordionItem value="rights" className="border-none">
              <AccordionTrigger className="px-4 text-base font-semibold text-slate-900 hover:no-underline">
                Your Patient Rights
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {result.patientRights.map((right, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 flex-shrink-0 mt-0.5">
                        &#10003;
                      </span>
                      {right}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Card className="border-blue-200 bg-blue-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-900">
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 leading-relaxed">
                {result.nextSteps}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
