/**
 * API base URL:
 *   - Dev:        '' (空字串 → CRA proxy → localhost:5000)
 *   - Production: REACT_APP_API_URL env var (e.g. https://wingame-backend.up.railway.app)
 */
export const API_BASE = process.env.REACT_APP_API_URL || '';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  return res;
}
