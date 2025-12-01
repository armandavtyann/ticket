export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Job {
  id: string;
  type: string;
  status: string;
  progress: number;
  payload: any;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items?: JobItem[];
  summary?: JobSummary;
  message?: string;
}

export interface JobItem {
  id: string;
  jobId: string;
  ticketId: string;
  success: boolean;
  error?: string;
  ticket?: Ticket;
}

export interface JobSummary {
  total: number;
  succeeded: number;
  failed: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketListResponse {
  tickets: Ticket[];
  pagination: Pagination;
}
