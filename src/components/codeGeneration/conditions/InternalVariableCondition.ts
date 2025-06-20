import type { Rule } from "../../ruleBuilder/types";

export const generateInternalVariableConditionCode = (
  rules: Rule[]
): string | null => {
  const condition = rules[0].conditionGroups[0].conditions[0];
  const variableName = (condition.params.variable_name as string) || "var1";
  const operator = (condition.params.operator as string) || "equals";
  const value = (condition.params.value as number) || 0;

  let comparison = "";
  switch (operator) {
    case "equals":
      comparison = `== ${value}`;
      break;
    case "not_equals":
      comparison = `~= ${value}`;
      break;
    case "greater_than":
      comparison = `> ${value}`;
      break;
    case "less_than":
      comparison = `< ${value}`;
      break;
    case "greater_equals":
      comparison = `>= ${value}`;
      break;
    case "less_equals":
      comparison = `<= ${value}`;
      break;
    default:
      comparison = `== ${value}`;
  }

  return `(card.ability.extra.${variableName} or 0) ${comparison}`;
};
