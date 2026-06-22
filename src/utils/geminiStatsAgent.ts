export interface StatResultItem {
  variable: string;
  label: string;
  value: number | string;
}

export interface StatAgentResult {
  summary?: string;
  results: StatResultItem[];
}

export async function runStatisticalAgent(prompt: string, dataset: unknown): Promise<StatAgentResult> {
  const response = await fetch("/api/stats-agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, dataset }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
