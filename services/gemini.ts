const WORKER_URL =
  "https://zenremind-gemini.harinath-krishnakumar.workers.dev";

export async function parseSmartReminder(input: string) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });

  return response.json();
}
