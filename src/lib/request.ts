// 读取 JSON 请求体；空请求体视为 {}，非法 JSON 返回失败
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  const text = await request.text();
  if (!text.trim()) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}
