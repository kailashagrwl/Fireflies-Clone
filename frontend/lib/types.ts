// TypeScript types mirroring the FastAPI Pydantic response schemas

export interface Participant {
  id: number;
  name: string;
  email: string;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_name: string | null;
  speaker_id: number | null;
  start_seconds: number | null;
  end_seconds: number | null;
  text: string;
  sequence: number;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview: string | null;
  key_points: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  meeting_id: number;
  title: string;
  start_seconds: number | null;
  end_seconds: number | null;
}

/** Lightweight version returned by GET /api/meetings/ */
export interface MeetingListItem {
  id: number;
  title: string;
  description: string | null;
  meeting_date: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  participants: Participant[];
}

/** Full version returned by GET /api/meetings/{id} */
export interface Meeting extends MeetingListItem {
  summary: Summary | null;
  action_items: ActionItem[];
  topics: Topic[];
  transcript_segments: TranscriptSegment[];
}

export type SortOrder = 'recent' | 'oldest';

export interface MeetingFilters {
  title?: string;
  participant_email?: string;
  date?: string;
  sort?: SortOrder;
}
