/**
 * Base mock service — simulates async network delay
 */

export function mockDelay(minMs = 150, maxMs = 350) {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export default { mockDelay };

