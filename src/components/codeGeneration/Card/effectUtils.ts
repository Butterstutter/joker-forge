import type { Effect } from "../../ruleBuilder/types";
import { generateAddMultReturn } from "./effects/AddMultEffect";
import { generateAddChipsReturn } from "./effects/AddChipsEffect";
import { generateEditDollarsReturn } from "./effects/EditDollarsEffect";
import { generateAddXChipsReturn } from "./effects/AddXChipsEffect";
import { generateAddXMultReturn } from "./effects/AddXMultEffect";
import { generateDestroyCardReturn } from "./effects/DestroyCardEffect";
import { generateRetriggerReturn } from "./effects/RetriggerEffect";
import { generateCreateJokerReturn } from "./effects/CreateJokerEffect";
import { generateDestroyJokerReturn } from "./effects/DestroyJokerEffect";
import { generateCopyJokerReturn } from "./effects/CopyJokerEffect";
import { generateLevelUpHandReturn } from "./effects/LevelUpHandEffect";
import { generateCreateConsumableReturn } from "./effects/CreateConsumableEffect";
import { generateCopyConsumableReturn } from "./effects/CopyConsumableEffect";
import { generateDestroyConsumableReturn } from "./effects/DestroyConsumableEffect";

export interface ConfigExtraVariable {
  name: string;
  value: number;
}

export interface EffectReturn {
  statement: string;
  message?: string;
  colour: string;
  configVariables?: string[];
  customCanUse?: string;
}

export interface ReturnStatementResult {
  statement: string;
  colour: string;
  preReturnCode?: string;
  isRandomChance?: boolean;
  configVariables?: string[];
  customCanUse?: string;
}

export interface RandomGroup {
  id: string;
  chance_numerator: number;
  chance_denominator: number;
  effects: Effect[];
}

const generateSingleEffect = (
  effect: Effect,
  trigger?: string
): EffectReturn => {
  switch (effect.type) {
    case "add_mult":
      return generateAddMultReturn(effect);

    case "add_chips":
      return generateAddChipsReturn(effect);

    case "add_x_chips":
      return generateAddXChipsReturn(effect);

    case "add_x_mult":
      return generateAddXMultReturn(effect);

    case "edit_dollars":
      return generateEditDollarsReturn(effect);

    case "destroy_card":
      return generateDestroyCardReturn(effect, trigger);

    case "retrigger_card":
      return generateRetriggerReturn(effect);

    case "create_joker":
      return generateCreateJokerReturn(effect);

    case "destroy_joker":
      return generateDestroyJokerReturn(effect);

    case "copy_joker":
      return generateCopyJokerReturn(effect);

    case "level_up_hand":
      return generateLevelUpHandReturn(effect);

    case "create_consumable":
      return generateCreateConsumableReturn(effect, trigger || "");

    case "copy_consumable":
      return generateCopyConsumableReturn(effect, trigger || "");

    case "destroy_consumable":
      return generateDestroyConsumableReturn(effect, trigger || "");

    default:
      return {
        statement: "",
        colour: "G.C.WHITE",
      };
  }
};

export function generateEffectReturnStatement(
  regularEffects: Effect[] = [],
  randomGroups: RandomGroup[] = [],
  modprefix: string,
  trigger?: string
): ReturnStatementResult {
  if (regularEffects.length === 0 && randomGroups.length === 0) {
    return {
      statement: "",
      colour: "G.C.WHITE",
      configVariables: [],
    };
  }

  let combinedPreReturnCode = "";
  let mainReturnStatement = "";
  let primaryColour = "G.C.WHITE";
  const customCanUseConditions: string[] = [];
  const allConfigVariables: string[] = [];
  const configVariableSet = new Set<string>();

  if (regularEffects.length > 0) {
    const effectReturns: EffectReturn[] = regularEffects
      .map((effect) => generateSingleEffect(effect, trigger))
      .filter((ret) => ret.statement || ret.message);

    effectReturns.forEach((effectReturn) => {
      if (effectReturn.configVariables) {
        effectReturn.configVariables.forEach((configVar) => {
          if (!configVariableSet.has(configVar)) {
            configVariableSet.add(configVar);
            allConfigVariables.push(configVar);
          }
        });
      }
      if (effectReturn.customCanUse) {
        customCanUseConditions.push(effectReturn.customCanUse);
      }
    });

    const effectCalls: string[] = [];

    effectReturns.forEach((effect) => {
      const { cleanedStatement, preReturnCode } = extractPreReturnCode(
        effect.statement
      );

      if (preReturnCode) {
        combinedPreReturnCode +=
          (combinedPreReturnCode ? "\n            " : "") + preReturnCode;
      }

      if (cleanedStatement && cleanedStatement.trim()) {
        const effectObj = `{${cleanedStatement.trim()}}`;
        effectCalls.push(`SMODS.calculate_effect(${effectObj}, card)`);
      }

      if (effect.message) {
        effectCalls.push(
          `card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${
            effect.message
          }, colour = ${effect.colour || "G.C.WHITE"}})`
        );
      }
    });

    if (combinedPreReturnCode && effectCalls.length > 0) {
      combinedPreReturnCode +=
        "\n            " + effectCalls.join("\n            ");
      mainReturnStatement = "";
    } else if (effectCalls.length > 0) {
      const pureStatementEffects = effectReturns.filter((effect) => {
        const { cleanedStatement } = extractPreReturnCode(effect.statement);
        return (
          cleanedStatement &&
          cleanedStatement.trim() &&
          !extractPreReturnCode(effect.statement).preReturnCode
        );
      });

      if (pureStatementEffects.length === effectReturns.length) {
        mainReturnStatement = buildEnhancementEffectCode(
          pureStatementEffects.map((effect) => ({
            ...effect,
            statement: extractPreReturnCode(effect.statement).cleanedStatement,
          }))
        );
      } else {
        combinedPreReturnCode = effectCalls.join("\n            ");
        mainReturnStatement = "";
      }
    }

    if (effectReturns.length > 0) {
      primaryColour = effectReturns[0]?.colour ?? "G.C.WHITE";
    }
  }

  if (randomGroups.length > 0) {
    const denominators = [
      ...new Set(randomGroups.map((group) => group.chance_denominator)),
    ];
    const denominatorToOddsVar: Record<number, string> = {};

    if (denominators.length === 1) {
      denominatorToOddsVar[denominators[0]] = "card.ability.extra.odds";
      const oddsVar = "odds = " + denominators[0];
      if (!configVariableSet.has(oddsVar)) {
        configVariableSet.add(oddsVar);
        allConfigVariables.push(oddsVar);
      }
    } else {
      denominators.forEach((denom, index) => {
        if (index === 0) {
          denominatorToOddsVar[denom] = "card.ability.extra.odds";
          const oddsVar = "odds = " + denom;
          if (!configVariableSet.has(oddsVar)) {
            configVariableSet.add(oddsVar);
            allConfigVariables.push(oddsVar);
          }
        } else {
          denominatorToOddsVar[denom] = `card.ability.extra.odds${index + 1}`;
          const oddsVar = `odds${index + 1} = ${denom}`;
          if (!configVariableSet.has(oddsVar)) {
            configVariableSet.add(oddsVar);
            allConfigVariables.push(oddsVar);
          }
        }
      });
    }

    randomGroups.forEach((group, groupIndex) => {
      const effectReturns: EffectReturn[] = group.effects
        .map((effect) => generateSingleEffect(effect, trigger))
        .filter((ret) => ret.statement || ret.message);

      effectReturns.forEach((effectReturn) => {
        if (effectReturn.configVariables) {
          effectReturn.configVariables.forEach((configVar) => {
            if (!configVariableSet.has(configVar)) {
              configVariableSet.add(configVar);
              allConfigVariables.push(configVar);
            }
          });
        }
        if (effectReturn.customCanUse) {
          customCanUseConditions.push(effectReturn.customCanUse);
        }
      });

      if (effectReturns.length === 0) return;

      const oddsVar = denominatorToOddsVar[group.chance_denominator];
      const probabilityIdentifier = `group_${groupIndex}_${group.id.substring(
        0,
        8
      )}`;

      let groupContent = "";
      let groupPreReturnCode = "";
      const groupEffectCalls: string[] = [];

      effectReturns.forEach((effect) => {
        const { cleanedStatement, preReturnCode } = extractPreReturnCode(
          effect.statement
        );

        if (preReturnCode) {
          groupPreReturnCode +=
            (groupPreReturnCode ? "\n                " : "") + preReturnCode;
        }

        if (cleanedStatement && cleanedStatement.trim()) {
          const effectObj = `{${cleanedStatement.trim()}}`;
          groupEffectCalls.push(`SMODS.calculate_effect(${effectObj}, card)`);
        }

        if (effect.message) {
          groupEffectCalls.push(
            `card_eval_status_text(context.blueprint_card or card, 'extra', nil, nil, nil, {message = ${
              effect.message
            }, colour = ${effect.colour || "G.C.WHITE"}})`
          );
        }
      });

      if (groupPreReturnCode) {
        groupContent += groupPreReturnCode;
        if (groupEffectCalls.length > 0) {
          groupContent +=
            "\n                " + groupEffectCalls.join("\n                ");
        }
      } else if (groupEffectCalls.length > 0) {
        groupContent = groupEffectCalls.join("\n                ");
      }

      const groupStatement = `if SMODS.pseudorandom_probability(card, '${probabilityIdentifier}', ${group.chance_numerator}, ${oddsVar}, 'm_${modprefix}') then
                ${groupContent}
            end`;

      combinedPreReturnCode +=
        (combinedPreReturnCode ? "\n            " : "") + groupStatement;
    });
  }

  return {
    statement: mainReturnStatement,
    colour: primaryColour,
    preReturnCode: combinedPreReturnCode || undefined,
    isRandomChance: randomGroups.length > 0,
    configVariables: allConfigVariables,
    customCanUse:
      customCanUseConditions.length > 0
        ? customCanUseConditions.join(" and ")
        : undefined,
  };
}

const buildEnhancementEffectCode = (effects: EffectReturn[]): string => {
  if (effects.length === 0) return "";

  const returnParts: string[] = [];

  effects.forEach((effect) => {
    if (effect.statement.trim()) {
      returnParts.push(effect.statement.trim());
    }
  });

  if (returnParts.length === 0) return "";

  if (returnParts.length === 1) {
    return `{ ${returnParts[0]} }`;
  }

  return `{ ${returnParts.join(", ")} }`;
};

function extractPreReturnCode(statement: string): {
  cleanedStatement: string;
  preReturnCode?: string;
} {
  const preReturnStart = "__PRE_RETURN_CODE__";
  const preReturnEnd = "__PRE_RETURN_CODE_END__";

  if (statement.includes(preReturnStart) && statement.includes(preReturnEnd)) {
    const startIndex =
      statement.indexOf(preReturnStart) + preReturnStart.length;
    const endIndex = statement.indexOf(preReturnEnd);

    if (startIndex < endIndex) {
      const preReturnCode = statement.substring(startIndex, endIndex).trim();
      const cleanedStatement = statement
        .replace(
          new RegExp(`${preReturnStart}[\\s\\S]*?${preReturnEnd}`, "g"),
          ""
        )
        .trim();

      return { cleanedStatement, preReturnCode };
    }
  }

  return { cleanedStatement: statement };
}
