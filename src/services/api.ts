const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function registerUserInDb(userData: {
  fullName: string;
  email: string;
  password: string;
  role: 'technician' | 'manager' | 'super_admin';
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data.user;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

export async function loginUserInDb(credentials: {
  email: string;
  password: string;
  role: 'technician' | 'manager';
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data.user;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

export async function uploadDocumentToDb(formData: FormData) {
  try {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Document upload failed');
    return data;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

export async function fetchDocumentsFromDb(filters?: { search?: string; status?: string }) {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);

    const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch documents');
    return data.documents;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

export async function fetchAuditLogsFromDb() {
  try {
    const res = await fetch(`${API_BASE}/audit-logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
    return data.auditLogs;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

export async function fetchMetricsFromDb() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch metrics');
    return data;
  } catch (err: any) {
    console.warn('Backend API connection warning:', err.message);
    return null;
  }
}

// RAG Pipeline API Methods (Modules 3.30 - 3.48)
export async function queryRAGVectorSearch(query: string, make?: string, model?: string) {
  try {
    const res = await fetch(`${API_BASE}/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, make, model }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'RAG vector search failed');
    return data;
  } catch (err: any) {
    console.warn('RAG Search warning:', err.message);
    return null;
  }
}

export async function fetchGroundedPrompt(query: string, make?: string, model?: string, vehicleContext?: string) {
  try {
    const res = await fetch(`${API_BASE}/rag/grounded-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, make, model, vehicleContext }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate grounded prompt');
    return data;
  } catch (err: any) {
    console.warn('Grounded prompt warning:', err.message);
    return null;
  }
}

export async function evaluateRAG(query: string, responseText: string, retrievedChunks: any[]) {
  try {
    const res = await fetch(`${API_BASE}/rag/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, responseText, retrievedChunks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to evaluate RAG answer');
    return data.evaluation;
  } catch (err: any) {
    return null;
  }
}

export async function logRAGQueryTelemetry(telemetry: {
  query: string;
  retrievedCount: number;
  topSimilarity: number;
  promptTokens: number;
  completionTokens: number;
  modelName: string;
  latencyMs: number;
  user?: string;
}) {
  try {
    await fetch(`${API_BASE}/rag/log-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry),
    });
  } catch (err: any) {
    console.warn('Telemetry log warning:', err.message);
  }
}

export async function fetchRAGTelemetryStats() {
  try {
    const res = await fetch(`${API_BASE}/rag/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch RAG stats');
    return data;
  } catch (err: any) {
    return null;
  }
}

// User-Isolated Session & Device API Methods
export async function fetchActiveSessionFromDb(email: string) {
  try {
    const res = await fetch(`${API_BASE}/sessions/active?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch active session');
    return data.session;
  } catch (err: any) {
    console.warn('Session API warning:', err.message);
    return null;
  }
}

export async function fetchAllSessionsFromDb() {
  try {
    const res = await fetch(`${API_BASE}/sessions/all`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch all sessions');
    return data.sessions;
  } catch (err: any) {
    console.warn('All sessions fetch warning:', err.message);
    return [];
  }
}

export async function createSessionInDb(sessionData: {
  userEmail: string;
  vin: string;
  make: string;
  model: string;
  year?: number;
  startedAt?: string;
  status?: string;
  mileage?: number;
  dtcCodes?: string[];
  technicianNote?: string;
  pairedDeviceId?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create session');
    return data.session;
  } catch (err: any) {
    console.warn('Session create API warning:', err.message);
    return null;
  }
}

export async function updateSessionInDb(id: string, updates: {
  status?: string;
  dtcCleared?: boolean;
  dtcCodes?: string[];
  technicianNote?: string;
  completedSteps?: string[];
}) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update session');
    return data.session;
  } catch (err: any) {
    console.warn('Session update API warning:', err.message);
    return null;
  }
}

export async function decodeVinInDb(vin: string) {
  try {
    const res = await fetch(`${API_BASE}/vin/decode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vin }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to decode VIN');
    return data.decoded;
  } catch (err: any) {
    console.warn('VIN decode API warning:', err.message);
    return null;
  }
}

export async function fetchPairedDevicesFromDb(email: string) {
  try {
    const res = await fetch(`${API_BASE}/devices?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch devices');
    return data.devices;
  } catch (err: any) {
    console.warn('Device fetch API warning:', err.message);
    return [];
  }
}

export async function pairDeviceInDb(deviceData: { userEmail: string; name: string; protocol?: string; macAddress?: string }) {
  try {
    const res = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to pair device');
    return data.device;
  } catch (err: any) {
    console.warn('Device pair API warning:', err.message);
    return null;
  }
}

// Super Admin API Methods
export async function fetchSystemHealthFromDb() {
  try {
    const res = await fetch(`${API_BASE}/admin/system-health`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch system health');
    return data.health;
  } catch (err: any) {
    console.warn('System health warning:', err.message);
    return null;
  }
}

export async function fetchAdminUsersFromDb() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin users');
    return data.users;
  } catch (err: any) {
    console.warn('Admin users fetch warning:', err.message);
    return [];
  }
}

export async function updateUserRoleInDb(id: number | string, role: string, adminUser?: string) {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, adminUser }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user role');
    return data;
  } catch (err: any) {
    console.warn('Role update warning:', err.message);
    return null;
  }
}

export async function deleteUserInDb(id: number | string) {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
    return data;
  } catch (err: any) {
    console.warn('Delete user warning:', err.message);
    return null;
  }
}

export async function toggleMaintenanceModeInDb(enabled: boolean) {
  try {
    const res = await fetch(`${API_BASE}/admin/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle maintenance mode');
    return data;
  } catch (err: any) {
    console.warn('Maintenance mode toggle warning:', err.message);
    return null;
  }
}

export async function reindexVectorDatabaseInDb() {
  try {
    const res = await fetch(`${API_BASE}/admin/reindex`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to re-index database');
    return data;
  } catch (err: any) {
    console.warn('Reindex database warning:', err.message);
    return null;
  }
}

// Feedback & Validation APIs
export async function fetchFeedbackFromDb() {
  try {
    const res = await fetch(`${API_BASE}/feedback`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch feedback');
    return data.feedback;
  } catch (err: any) {
    console.warn('Fetch feedback warning:', err.message);
    return [];
  }
}

export async function submitFeedbackInDb(feedbackData: { docId?: number; submittedBy: string; type: string; message: string }) {
  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');
    return data;
  } catch (err: any) {
    console.warn('Submit feedback warning:', err.message);
    return null;
  }
}

export async function updateFeedbackStatusInDb(id: number, status: string, reviewedBy?: string) {
  try {
    const res = await fetch(`${API_BASE}/feedback/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedBy }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update feedback status');
    return data;
  } catch (err: any) {
    console.warn('Update feedback status warning:', err.message);
    return null;
  }
}

export async function validateDocumentInDb(docId: number, status: string, validatedBy: string) {
  try {
    const res = await fetch(`${API_BASE}/documents/${docId}/validate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, validatedBy }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to validate document');
    return data;
  } catch (err: any) {
    console.warn('Validate document warning:', err.message);
    return null;
  }
}

export async function fetchManagerChatLogsFromDb(filters?: { search?: string; technician?: string; status?: string; vin?: string }) {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.technician && filters.technician !== 'All') params.append('technician', filters.technician);
    if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters?.vin && filters.vin !== 'All') params.append('vin', filters.vin);

    const res = await fetch(`${API_BASE}/manager/chat-logs?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chat logs');
    return data.chatLogs;
  } catch (err: any) {
    console.warn('Fetch manager chat logs warning:', err.message);
    return null;
  }
}

export async function logManagerChatLogInDb(chatLogData: {
  technicianEmail: string;
  vin?: string;
  query: string;
  response: string;
  status?: string;
  retrievedCount?: number;
  make?: string;
  model?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/manager/chat-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatLogData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log technician chat');
    return data;
  } catch (err: any) {
    console.warn('Log technician chat warning:', err.message);
    return null;
  }
}

