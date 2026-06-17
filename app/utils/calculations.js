export const perMile = (pay, miles) => miles > 0 ? (pay / miles).toFixed(2) : 0;
export const verdict = (rate) => rate >= 0.70 ? "SOLID" : rate >= 0.50 ? "OK" : "WEAK";
export const verdictColor = (rate, C) => rate >= 0.70 ? C.safe : rate >= 0.50 ? C.warn : C.danger;
export const estimatedReal = (stated) => (stated * 1.3).toFixed(1);
export const shortage = (actual, stated) => (actual - stated).toFixed(1);
export const disputeText = (restaurant, stated, actual) =>
  `DD stated ${stated} mi, I actually drove ${actual} mi to complete this order at ${restaurant}. Requesting adjustment for ${shortage(actual, stated)} mile difference.`;
