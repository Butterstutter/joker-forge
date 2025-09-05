import type { Effect } from "../../../ruleBuilder/types";
import { EffectReturn } from "../effectUtils";

export const generateSavedReturn = (effect: Effect): EffectReturn => {
  const customMessage = effect.customMessage;

  const result: EffectReturn = {
    statement: `saved = true`,
    colour: "G.C.RED",
  };

  if (customMessage) {
    result.message = `"${customMessage}"`;
  } else {
    result.message = `localize('k_saved_ex')`;
  }

  return result;
};
