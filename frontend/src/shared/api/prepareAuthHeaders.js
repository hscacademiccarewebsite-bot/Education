export function prepareAuthHeaders(headers, getState) {
  const token = getState?.()?.auth?.token;
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return headers;
}

