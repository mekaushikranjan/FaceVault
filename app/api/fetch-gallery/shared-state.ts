// Create a shared state file to store the fetch status
// This allows us to share state between API route files

// Define the fetch status type
export type FetchStatus = {
  status: "idle" | "running" | "completed" | "failed"
  progress: number
  imageCount: number
  startTime?: number
  endTime?: number
  error?: string
}

// Export the fetch status variable so it can be imported by other files
export const fetchStatus: FetchStatus = {
  status: "idle",
  progress: 0,
  imageCount: 0,
}
