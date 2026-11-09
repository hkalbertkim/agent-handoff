// An optional, bounded model-assisted diagnosis. The model never receives tool access.
// Its output is advisory text; mutations are solely through the server's policy-gated actions.
export async function modelDiagnosis(
  {goal, fixture, constraints},
  {apiKey = process.env.OPENAI_API_KEY,
   model = process.env.OPENAI_MODEL || 'gpt-6-luna',
   endpoint = process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses',
   request = fetch} = {}
) {
  if (!apiKey) throw new Error('MODEL_NOT_CONFIGURED');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await request(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey},
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 240,
        instructions: 'You are a read-only code diagnosis assistant. Explain the defect and a minimal safe fix in 1-3 sentences. Follow the constraints. Never request tools, secrets or privileged execution.',
        input: 'Task: ' + goal + '\nConstraints: ' + constraints.join('; ') + '\nCode: ' + fixture
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('MODEL_HTTP_' + response.status);
    const result = await response.json();
    const output = result.output_text ??
      (result.output || []).flatMap(item => item.content || [])
        .filter(item => item.type === 'output_text').map(item => item.text).join('\n');
    if (typeof output !== 'string' || !output.trim())
      throw new Error('MODEL_EMPTY_OUTPUT');
    return output.trim().slice(0, 1400);
  } finally {
    clearTimeout(timeout);
  }
}
