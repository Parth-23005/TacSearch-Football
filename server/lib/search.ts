// Placeholder for any advanced mock logic if needed. 
// Currently storage.ts handles the DB query. 
// If we needed to simulate "confidence scores" dynamically based on the query text, we'd do it here.

export function calculateMockConfidence(query: string, description: string): number {
  // Simple heuristic for demo purposes:
  // If exact match of a keyword, high score.
  // Otherwise random high-ish score.
  
  const keywords = query.toLowerCase().split(' ');
  const descLower = description.toLowerCase();
  
  let matches = 0;
  for (const word of keywords) {
    if (descLower.includes(word)) matches++;
  }
  
  if (matches > 0) {
    return 0.85 + (matches / keywords.length) * 0.14; // 0.85 to 0.99
  }
  
  return 0.70 + Math.random() * 0.2; // 0.70 to 0.90 random
}
