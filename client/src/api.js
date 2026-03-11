async function r(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export const loadLists = () => r('GET', '/api/lists');
export const addForeman = (name) => r('POST', '/api/foremen', { name });
export const editForeman = (oldName, newName) => r('PUT', '/api/foremen', { oldName, newName });
export const deleteForeman = (name) => r('DELETE', `/api/foremen/${encodeURIComponent(name)}`);
export const addEmployee = (name) => r('POST', '/api/employees', { name });
export const editEmployee = (oldName, newName) => r('PUT', '/api/employees', { oldName, newName });
export const deleteEmployee = (name) => r('DELETE', `/api/employees/${encodeURIComponent(name)}`);
export const addSite = (name) => r('POST', '/api/sites', { name });
export const editSite = (oldName, newName) => r('PUT', '/api/sites', { oldName, newName });
export const deleteSite = (name) => r('DELETE', `/api/sites/${encodeURIComponent(name)}`);
export const addWorker = (name) => r('POST', '/api/workers', { name });
export const editWorker = (oldName, newName) => r('PUT', '/api/workers', { oldName, newName });
export const deleteWorker = (name) => r('DELETE', `/api/workers/${encodeURIComponent(name)}`);

export const loadRecipients = () => r('GET', '/api/recipients');
export const addRecipient = (email, name) => r('POST', '/api/recipients', { email, name });
export const toggleRecipient = (id, active) => r('PUT', `/api/recipients/${id}/toggle`, { active });
export const deleteRecipient = (id) => r('DELETE', `/api/recipients/${id}`);

export const submitReport = (data) => r('POST', '/api/reports', data);
export const getReportsByMonth = (ym) => r('GET', `/api/reports/month/${ym}`);
export const getReportsByDate = (date) => r('GET', `/api/reports/date/${date}`);
export const getReportById = (id) => r('GET', `/api/reports/${id}`);

export const loadPings = () => r('GET', '/api/pings');
export const addPing = (msg, from) => r('POST', '/api/pings', { msg, from });
export const deletePing = (id) => r('DELETE', `/api/pings/${id}`);
export const clearPings = () => r('DELETE', '/api/pings/all');

export const getSession = (foreman) => r('GET', `/api/sessions/${encodeURIComponent(foreman)}`);

export const getOffByDate = (date) => r('GET', `/api/off/${date}`);
export const getOffByMonth = (ym) => r('GET', `/api/off/month/${ym}`);
export const toggleOff = (name, date) => r('POST', '/api/off/toggle', { name, date });
