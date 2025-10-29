import type { Effect } from "../../ruleBuilder/types";
import type { EffectReturn, PassiveEffectResult } from "../effectUtils";
import { generateConfigVariables, parseGameVariable, parseRangeVariable } from "../gameVariableUtils";
import { generateGameVariableCode } from "../Consumables/gameVariableUtils";

export const generateEditJokerSlotsPassiveEffectCode = (
  effect: Effect
): PassiveEffectResult => {
  const operation = effect.params?.operation || "add";
  const effectValue = effect.params.value;
  const parsed = parseGameVariable(effectValue);
  const rangeParsed = parseRangeVariable(effectValue);

  let valueCode: string;

  if (parsed.isGameVariable) { /// change to generateConfigVariables maybe, i dunno, i dont see it necessary
    valueCode = generateGameVariableCode(effectValue as string);
  } else if (rangeParsed.isRangeVariable) {
    const seedName = `jokerslots_passive`;
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
      addToDeck = `G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}`;
      removeFromDeck = `G.jokers.config.card_limit = G.jokers.config.card_limit - ${valueCode}`;
      break;
    case "subtract":
      addToDeck = `G.jokers.config.card_limit = math.max(1, G.jokers.config.card_limit - ${valueCode})`;
      removeFromDeck = `G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}`;
      break;
    case "set":
      addToDeck = `card.ability.extra.original_joker_slots = G.jokers.config.card_limit
        G.jokers.config.card_limit = ${valueCode}`;
      removeFromDeck = `if card.ability.extra.original_joker_slots then
            G.jokers.config.card_limit = card.ability.extra.original_joker_slots
        end`;
      break;
    default:
      addToDeck = `G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}`;
      removeFromDeck = `G.jokers.config.card_limit = G.jokers.config.card_limit - ${valueCode}`;
  }

  return {
    addToDeck,
    removeFromDeck,
    configVariables: [],
    locVars: [],
  };
};



export const generateEditJokerSlotsEffectCode = (
  effect: Effect,
  itemType: string,
  sameTypeCount: number = 0,
): EffectReturn => {
  switch(itemType) {
    case "joker":
      return generateJokerCode(effect, sameTypeCount)
    case "consumable":
      return generateConsumableCode(effect, sameTypeCount)
    case "voucher":
      return generateVoucherCode(effect, sameTypeCount)
    case "deck":
      return generateDeckCode(effect, sameTypeCount)

    default:
      return {
        statement: "",
        colour: "G.C.WHITE",
      };
  }
}

const generateJokerCode = (
  effect: Effect,
  sameTypeCount: number = 0,
): EffectReturn => {
  const operation = effect.params?.operation || "add";

  const variableName =
    sameTypeCount === 0 ? "joker_slots" : `joker_slots${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'joker'
  )

  const customMessage = effect.customMessage;
  let statement = "";

  switch (operation) {
    case "add": {
      const addMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Joker Slot"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${addMessage}, colour = G.C.DARK_EDITION})
                G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}
                return true
            end`;
      break;
    }
    case "subtract": {
      const subtractMessage = customMessage
        ? `"${customMessage}"`
        : `"-"..tostring(${valueCode}).." Joker Slot"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${subtractMessage}, colour = G.C.RED})
                G.jokers.config.card_limit = math.max(1, G.jokers.config.card_limit - ${valueCode})
                return true
            end`;
      break;
    }
    case "set": {
      const setMessage = customMessage
        ? `"${customMessage}"`
        : `"Joker Slots set to "..tostring(${valueCode})`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${setMessage}, colour = G.C.BLUE})
                G.jokers.config.card_limit = ${valueCode}
                return true
            end`;
      break;
    }
    default: {
      const defaultMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Joker Slot"`;
      statement = `func = function()
                card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${defaultMessage}, colour = G.C.DARK_EDITION})
                G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}
                return true
            end`;
    }
  }

  return {
    statement,
    colour: "G.C.DARK_EDITION",
    configVariables: configVariables.length > 0 ? configVariables : undefined,
  };
};

const generateConsumableCode = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const operation = effect.params?.operation || "add";
  const customMessage = effect.customMessage;

  const variableName =
    sameTypeCount === 0 ? "joker_slots_value" : `joker_slots_value${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'deck'
  );

  let jokerSlotsCode = "";

  switch (operation) {
    case "add": {
      const addMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Joker Slot"`;
      jokerSlotsCode = `
            __PRE_RETURN_CODE__
            G.E_MANAGER:add_event(Event({
                trigger = 'after',
                delay = 0.4,
                func = function()
                    card_eval_status_text(used_card, 'extra', nil, nil, nil, {message = ${addMessage}, colour = G.C.DARK_EDITION})
                    G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}
                    return true
                end
            }))
            delay(0.6)
            __PRE_RETURN_CODE_END__`;
      break;
    }
    case "subtract": {
      const subtractMessage = customMessage
        ? `"${customMessage}"`
        : `"-"..tostring(${valueCode}).." Joker Slot"`;
      jokerSlotsCode = `
            __PRE_RETURN_CODE__
            G.E_MANAGER:add_event(Event({
                trigger = 'after',
                delay = 0.4,
                func = function()
                    card_eval_status_text(used_card, 'extra', nil, nil, nil, {message = ${subtractMessage}, colour = G.C.RED})
                    G.jokers.config.card_limit = math.max(1, G.jokers.config.card_limit - ${valueCode})
                    return true
                end
            }))
            delay(0.6)
            __PRE_RETURN_CODE_END__`;
      break;
    }
    case "set": {
      const setMessage = customMessage
        ? `"${customMessage}"`
        : `"Joker Slots set to "..tostring(${valueCode})`;
      jokerSlotsCode = `
            __PRE_RETURN_CODE__
            G.E_MANAGER:add_event(Event({
                trigger = 'after',
                delay = 0.4,
                func = function()
                    card_eval_status_text(used_card, 'extra', nil, nil, nil, {message = ${setMessage}, colour = G.C.BLUE})
                    G.jokers.config.card_limit = ${valueCode}
                    return true
                end
            }))
            delay(0.6)
            __PRE_RETURN_CODE_END__`;
      break;
    }
    default: {
      const defaultMessage = customMessage
        ? `"${customMessage}"`
        : `"+"..tostring(${valueCode}).." Joker Slot"`;
      jokerSlotsCode = `
            __PRE_RETURN_CODE__
            G.E_MANAGER:add_event(Event({
                trigger = 'after',
                delay = 0.4,
                func = function()
                    card_eval_status_text(used_card, 'extra', nil, nil, nil, {message = ${defaultMessage}, colour = G.C.DARK_EDITION})
                    G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}
                    return true
                end
            }))
            delay(0.6)
            __PRE_RETURN_CODE_END__`;
    }
  }

  return {
    statement: jokerSlotsCode,
    colour: "G.C.DARK_EDITION",
    configVariables,
  };
};

const generateVoucherCode = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const operation = effect.params?.operation || "add";
  const variableName =
    sameTypeCount === 0 ? "joker_slots_value" : `joker_slots_value${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'deck'
  );

  let jokerSlotsCode = "";

    if (operation === "add") {
        jokerSlotsCode += `
        G.E_MANAGER:add_event(Event({
            func = function()
        G.jokers.config.card_limit = G.jokers.config.card_limit + ${valueCode}
                return true
            end
        }))
        `;
  } else if (operation === "subtract") {
        jokerSlotsCode += `
        G.E_MANAGER:add_event(Event({
            func = function()
        G.jokers.config.card_limit = math.max(1, G.jokers.config.card_limit - ${valueCode})
                return true
            end
        }))
        `;
  } else if (operation === "set") {
        jokerSlotsCode += `
        G.E_MANAGER:add_event(Event({
            func = function()
G.jokers.config.card_limit = ${valueCode}
                return true
            end
        }))
        `;
  }

  return {
    statement: jokerSlotsCode,
    colour: "G.C.DARK_EDITION",
    configVariables,
  };
};

const generateDeckCode = (
  effect: Effect,
  sameTypeCount: number = 0
): EffectReturn => {
  const operation = effect.params?.operation || "add";
  const variableName =
    sameTypeCount === 0 ? "joker_slots_value" : `joker_slots_value${sameTypeCount + 1}`;

  const { valueCode, configVariables } = generateConfigVariables(
    effect.params?.value,
    effect.id,
    variableName,
    'deck'
  );

  let jokerSlotsCode = "";

    if (operation === "add") {
        jokerSlotsCode += `
        G.GAME.starting_params.joker_slots = G.GAME.starting_params.joker_slots + ${valueCode}
        `;
  } else if (operation === "subtract") {
        jokerSlotsCode += `
        G.GAME.starting_params.joker_slots = G.GAME.starting_params.joker_slots - ${valueCode}
        `;
  } else if (operation === "set") {
        jokerSlotsCode += `
   G.GAME.starting_params.joker_slots = ${valueCode}
        `;
  }

  return {
    statement: jokerSlotsCode,
    colour: "G.C.DARK_EDITION",
    configVariables,
  };
}