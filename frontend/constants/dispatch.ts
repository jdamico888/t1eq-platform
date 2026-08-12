import { DispatchJobStatus } from "@/types/dispatch-job";

export const DISPATCH_JOB_STATUSES: DispatchJobStatus[] = [
  "Scheduled",
  "Dispatched",
  "On Site",
  "Paused",
  "Completed",
  "Cancelled",
];