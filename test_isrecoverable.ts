const err: any = {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash\nPlease retry in 47.442666064s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"model":"gemini-3.6-flash","location":"global"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"47s"}]}};

const errorMessage = String(err?.message || err?.error?.message || err).toLowerCase();
const isRecoverable =
  err?.status === 429 ||
  err?.status === 503 ||
  err?.status === 500 ||
  err?.status === 404 ||
  err?.error?.code === 503 ||
  err?.error?.code === 429 ||
  err?.error?.code === 500 ||
  err?.error?.code === 404 ||
  errorMessage.includes('unavailable') ||
  errorMessage.includes('quota') ||
  errorMessage.includes('resource_exhausted') ||
  errorMessage.includes('not found') ||
  errorMessage.includes('overloaded') ||
  errorMessage.includes('fetch failed') ||
  errorMessage.includes('503');

console.log("errorMessage:", errorMessage);
console.log("isRecoverable:", isRecoverable);
