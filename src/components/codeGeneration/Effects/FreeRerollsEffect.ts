import type { Effect } from "../../ruleBuilder/types";
import type { EffectReturn, PassiveEffectResult } from "../effectUtils";
import { generateConfigVariables } from "../gameVariableUtils";

export const generateFreeRerollsPassiveEffectCode = (
  effect: Effect,
): PassiveEffectResult => {
  const variableName = "reroll_amount";

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'joker'
  );

  return {
    addToDeck: `SMODS.change_free_rerolls(${valueCode})`,
    removeFromDeck: `SMODS.change_free_rerolls(-(${valueCode}))`,
    configVariables:
      configVariables.length > 0
        ? configVariables.map((cv) => cv.name + " = " + cv.value)
        : [],
    locVars: [],
  };
};

export const generateFreeRerollsEffectCode = (
  effect: Effect,
  itemType: string,
  sameTypeCount: number = 0
): EffectReturn => {
  switch(itemType) {
    case "voucher":
      return generateVoucherCode(effect, sameTypeCount)

    default:
      return {
        statement: "",
        colour: "G.C.WHITE",
      };
  }
}

const generateVoucherCode = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const variableName =
    sameTypeCount === 0 ? "rerrols_value" : `rerolls_value${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'voucher;'
  );

  const FreeRerollsCode = `SMODS.change_free_rerolls(${valueCode})`

  return {
    statement: FreeRerollsCode,
    colour: "G.C.DARK_EDITION",
    configVariables
  };
};