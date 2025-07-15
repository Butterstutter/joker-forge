import type { EffectReturn, ConfigExtraVariable } from "../effectUtils";
import type { Effect } from "../../ruleBuilder/types";
import type { PassiveEffectResult } from "../effectUtils";
import {
  generateGameVariableCode,
  parseGameVariable,
  parseRangeVariable,
} from "../gameVariableUtils";

export const generateEditHandSizeReturn = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const operation = effect.params?.operation || "add";
  const effectValue = effect.params.value;
  const parsed = parseGameVariable(effectValue);
  const rangeParsed = parseRangeVariable(effectValue);

  let valueCode: string;
  const configVariables: ConfigExtraVariable[] = [];

  const variableName =
    sameTypeCount === 0 ? "hand_size" : `hand_size${sameTypeCount + 1}`;

  if (parsed.isGameVariable) {
    valueCode = generateGameVariableCode(effectValue as string);
  } else if (rangeParsed.isRangeVariable) {
    const seedName = `${variableName}_${effect.id.substring(0, 8)}`;
    valueCode = `pseudorandom('${seedName}', card.ability.extra.${variableName}_min, card.ability.extra.${variableName}_max)`;

    configVariables.push(
      { name: `${variableName}_min`, value: rangeParsed.min || 1 },
      { name: `${variableName}_max`, value: rangeParsed.max || 5 }
    );
  } else if (typeof effectValue === "string") {
    valueCode = `card.ability.extra.${effectValue}`;
  } else if (
    typeof effectValue === "number" ||
    typeof effectValue === "boolean"
  ) {
    valueCode = `card.ability.extra.${variableName}`;

    configVariables.push({
      name: variableName,
      value: Number(effectValue) || 1,
    });
  } else {
    valueCode = "";
  }

  const customMessage = effect.customMessage;
  let statement = "";

  switch (operation) {
    case "add": {
      const addMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Hand Size"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${addMessage}, colour = G.C.BLUE})
                G.hand:change_size(${valueCode})
                return true
            end`;
      break;
    }
    case "subtract": {
      const subtractMessage = customMessage
        ? `"${customMessage}"`
        : `"-"..tostring(${valueCode}).." Hand Size"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${subtractMessage}, colour = G.C.RED})
                G.hand:change_size(-${valueCode})
                return true
            end`;
      break;
    }
    case "set": {
      const setMessage = customMessage
        ? `"${customMessage}"`
        : `"Hand Size set to "..tostring(${valueCode})`;
      statement = `func = function()
                local current_hand_size = G.hand.config.card_limit
                local target_hand_size = ${valueCode}
                local difference = target_hand_size - current_hand_size
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${setMessage}, colour = G.C.BLUE})
                G.hand:change_size(difference)
                return true
            end`;
      break;
    }
    default: {
      const defaultMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Hand Size"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${defaultMessage}, colour = G.C.BLUE})
                G.hand:change_size(${valueCode})
                return true
            end`;
    }
  }

  return {
    statement,
    colour: "G.C.BLUE",
    configVariables: configVariables.length > 0 ? configVariables : undefined,
  };
};

export const generatePassiveHandSize = (
  effect: Effect
): PassiveEffectResult => {
  const operation = effect.params?.operation || "add";
  const effectValue = effect.params.value;
  const parsed = parseGameVariable(effectValue);
  const rangeParsed = parseRangeVariable(effectValue);

  let valueCode: string;

  if (parsed.isGameVariable) {
    valueCode = generateGameVariableCode(effectValue as string);
  } else if (rangeParsed.isRangeVariable) {
    const seedName = `handsize_passive`;
    valueCode = `pseudorandom('${seedName}', ${rangeParsed.min}, ${rangeParsed.max})`;
  } else if (typeof effectValue === "string") {
    valueCode = `card.ability.extra.${effectValue}`;
  } else {
    valueCode = (effectValue as number | boolean).toString();
  }

  let addToDeck = "";
  let removeFromDeck = "";

  switch (operation) {
    case "add":
      addToDeck = `G.hand:change_size(${valueCode})`;
      removeFromDeck = `G.hand:change_size(-${valueCode})`;
      break;
    case "subtract":
      addToDeck = `G.hand:change_size(-${valueCode})`;
      removeFromDeck = `G.hand:change_size(${valueCode})`;
      break;
    case "set":
      addToDeck = `card.ability.extra.original_hand_size = G.hand.config.card_limit
        local difference = ${valueCode} - G.hand.config.card_limit
        G.hand:change_size(difference)`;
      removeFromDeck = `if card.ability.extra.original_hand_size then
            local difference = card.ability.extra.original_hand_size - G.hand.config.card_limit
            G.hand:change_size(difference)
        end`;
      break;
    default:
      addToDeck = `G.hand:change_size(${valueCode})`;
      removeFromDeck = `G.hand:change_size(-${valueCode})`;
  }

  return {
    addToDeck,
    removeFromDeck,
    configVariables: [],
    locVars: [],
  };
};
