export interface IdempotencyResult {
  isDuplicate: boolean;
  existingJobId?: string;
  key: string;
}
