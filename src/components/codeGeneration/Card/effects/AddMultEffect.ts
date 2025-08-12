import type { Effect } from "../../../ruleBuilder/types";
import {
  generateConfigVariables,
} from "../../Jokers/gameVariableUtils";
import type { EffectReturn } from "../effectUtils";

export const generateAddMultReturn = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const variableName =
    sameTypeCount === 0 ? "mult" : `mult${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
      effect.params?.value,
      effect.id,
      variableName
    )

  const customMessage = effect.customMessage;

  const result: EffectReturn = {
    statement: `mult = ${valueCode}`,
    colour: "G.C.MULT",
    configVariables:
      configVariables.length > 0
        ? configVariables.map((cv) => `${cv.name} = ${cv.value}`)
        : undefined,
  };

  if (customMessage) {
    result.message = `"${customMessage}"`;
  }

  return result;
};
