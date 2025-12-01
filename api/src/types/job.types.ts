export interface CreateJobData {
  type: string;
  payload: any;
  userId: string;
}

export interface JobFilters {
  type?: string;
  status?: string;
  userId?: string;
}

export interface JobSummary {
  total: number;
  succeeded: number;
  failed: number;
}
