import type { Rule } from "../../ruleBuilder/types";
import type { JokerData } from "../../JokerCard";
import { generateGameVariableCode } from "../gameVariableUtils";
import { parseSuitVariable } from "../variableUtils";

export const generateSuitCardConditionCode = (
  rules: Rule[],
  joker?: JokerData
): string | null => {
  const condition = rules[0].conditionGroups[0].conditions[0];
  const triggerType = rules[0].trigger || "hand_played";

  const suitType = (condition.params.suit_type as string) || "specific";
  const specificSuit = condition.params.specific_suit;
  const suitGroup = (condition.params.suit_group as string) || null;
  const quantifier = (condition.params.quantifier as string) || "at_least_one";
  const count = generateGameVariableCode(condition.params.count);
  const scope = (condition.params.card_scope as string) || "scoring";

  const suitVarInfo = parseSuitVariable(specificSuit, joker);

  const getSuitsCheckLogic = (
    suits: string[],
    useVariable = false,
    varCode?: string
  ): string => {
    if (useVariable && varCode) {
      return `c:is_suit(${varCode})`;
    } else if (suits.length === 1) {
      return `c:is_suit("${suits[0]}")`;
    } else {
      return suits.map((suit) => `c:is_suit("${suit}")`).join(" or ");
    }
  };

  let suits: string[] = [];
  let useVariable = false;
  let variableCode = "";

  if (suitType === "specific") {
    if (suitVarInfo.isSuitVariable) {
      useVariable = true;
      variableCode = suitVarInfo.code!;
    } else if (typeof specificSuit === "string") {
      suits = [specificSuit];
    }
  } else if (suitType === "group" && suitGroup) {
    if (suitGroup === "red") {
      suits = ["Hearts", "Diamonds"];
    } else if (suitGroup === "black") {
      suits = ["Spades", "Clubs"];
    }
  }

  const cardsToCheck =
    scope === "scoring" ? "context.scoring_hand" : "context.full_hand";

  if (
    triggerType === "card_discarded" ||
    triggerType === "card_held_in_hand" ||
    (triggerType === "card_scored" && condition.type === "card_suit")
  ) {
    const checkLogic = getSuitsCheckLogic(
      suits,
      useVariable,
      variableCode
    ).replace(/c:/g, "context.other_card:");
    return checkLogic;
  } else {
    switch (quantifier) {
      case "at_least_one":
        return `(function()
    local suitFound = false
    for i, c in ipairs(${cardsToCheck}) do
        if ${getSuitsCheckLogic(suits, useVariable, variableCode)} then
            suitFound = true
            break
        end
    end
    
    return suitFound
end)()`;

      case "all":
        return `(function()
    local allMatchSuit = true
    for i, c in ipairs(${cardsToCheck}) do
        if not (${getSuitsCheckLogic(suits, useVariable, variableCode)}) then
            allMatchSuit = false
            break
        end
    end
    
    return allMatchSuit and #${cardsToCheck} > 0
end)()`;

      case "exactly":
        return `(function()
    local suitCount = 0
    for i, c in ipairs(${cardsToCheck}) do
        if ${getSuitsCheckLogic(suits, useVariable, variableCode)} then
            suitCount = suitCount + 1
        end
    end
    
    return suitCount == ${count}
end)()`;

      case "at_least":
        return `(function()
    local suitCount = 0
    for i, c in ipairs(${cardsToCheck}) do
        if ${getSuitsCheckLogic(suits, useVariable, variableCode)} then
            suitCount = suitCount + 1
        end
    end
    
    return suitCount >= ${count}
end)()`;

      case "at_most":
        return `(function()
    local suitCount = 0
    for i, c in ipairs(${cardsToCheck}) do
        if ${getSuitsCheckLogic(suits, useVariable, variableCode)} then
            suitCount = suitCount + 1
        end
    end
    
    return suitCount <= ${count} and suitCount > 0
end)()`;

      default:
        return `(function()
    local suitFound = false
    for i, c in ipairs(${cardsToCheck}) do
        if ${getSuitsCheckLogic(suits, useVariable, variableCode)} then
            suitFound = true
            break
        end
    end
    
    return suitFound
end)()`;
    }
  }
};
