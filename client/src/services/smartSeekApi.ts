// api.ts
export interface AuthResponse {
  id: string;
  appName: string;
  userId: string;
  state: any;
  events: any[];
  lastUpdateTime: number;
}

export interface RunRequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: {
    role: "user" | "assistant";
    parts: { text: string }[];
  };
}

export interface RunResponse {
  // Adjust according to your backend response
  result: any;
}

/**
 * Authenticate / create a session
 */
export async function authenticateAgent(
  appName: string,
  userId: string,
  sessionId: string
): Promise<AuthResponse> {
  const res = await fetch(
    `http://localhost:8000/apps/${appName}/users/${userId}/sessions/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: sessionId, appName, userId }),
    }
  );

  if (!res.ok) throw new Error(`Auth failed: ${res.statusText}`);
  return res.json();
}

/**
 * Send a command / message to the agent
 */
export async function runAgentCommand(
  payload: RunRequest
): Promise<RunResponse> {
  const res = await fetch("http://localhost:8000/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Run failed: ${res.statusText}`);
  return res.json();
}
