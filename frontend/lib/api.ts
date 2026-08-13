import type {
  Meeting,
  MeetingListItem,
  TranscriptSegment,
  Summary,
  ActionItem,
  MeetingFilters,
} from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json() as Promise<T>;
}

/** Build a query string from a filters object, skipping empty values. */
function buildQuery(filters: MeetingFilters): string {
  const params = new URLSearchParams();
  if (filters.title) {
    params.set('title', filters.title);
  }
  if (filters.participant_email) {
    // Wrap with SQL-style wildcards for case-insensitive substring search in sqlite
    params.set('participant_email', `%${filters.participant_email}%`);
  }
  if (filters.date) {
    params.set('date', filters.date);
  }
  if (filters.sort) {
    params.set('sort', filters.sort);
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------

export async function getMeetings(
  filters: MeetingFilters = {}
): Promise<MeetingListItem[]> {
  return apiFetch<MeetingListItem[]>(`/api/meetings/${buildQuery(filters)}`);
}

export async function getMeeting(id: number): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${id}`);
}

export async function createMeeting(payload: any): Promise<Meeting> {
  return apiFetch<Meeting>('/api/meetings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateMeeting(id: number, payload: any): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteMeeting(id: number): Promise<void> {
  return apiFetch<void>(`/api/meetings/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Sub-resources
// ---------------------------------------------------------------------------

export async function getTranscript(
  meetingId: number
): Promise<TranscriptSegment[]> {
  return apiFetch<TranscriptSegment[]>(
    `/api/meetings/${meetingId}/transcript`
  );
}

export async function getSummary(meetingId: number): Promise<Summary> {
  return apiFetch<Summary>(`/api/meetings/${meetingId}/summary`);
}

export async function getActionItems(
  meetingId: number
): Promise<ActionItem[]> {
  return apiFetch<ActionItem[]>(
    `/api/meetings/${meetingId}/action-items`
  );
}

export async function createActionItem(
  meetingId: number,
  payload: any
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/api/meetings/${meetingId}/action-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Action Items CRUD (client-side mutations)
// ---------------------------------------------------------------------------

export async function patchActionItem(
  id: number,
  payload: Partial<Pick<ActionItem, 'title' | 'description' | 'assignee' | 'due_date' | 'completed'>>
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/api/action-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteActionItem(id: number): Promise<void> {
  return apiFetch<void>(`/api/action-items/${id}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// LLM Summary Generation
// ---------------------------------------------------------------------------

export async function generateSummary(meetingId: number): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}/generate-summary`, {
    method: 'POST',
  });
}

export async function regenerateSummary(meetingId: number): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}/regenerate-summary`, {
    method: 'POST',
  });
}

export async function testConnection(): Promise<{ status: string; service: string }> {
  return apiFetch<{ status: string; service: string }>('/health');
}

