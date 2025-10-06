import type { EffectReturn } from "../effectUtils";
import type { Effect } from "../../../ruleBuilder/types";

export const generateWinBlindReturn = (
  effect: Effect,
): EffectReturn => {
  const customMessage = effect.customMessage;

  const WinBlindCode = `
            G.E_MANAGER:add_event(Event({
    blocking = false,
    func = function()
        if G.STATE == G.STATES.SELECTING_HAND then
            G.GAME.chips = G.GAME.blind.chips
            G.STATE = G.STATES.HAND_PLAYED
            G.STATE_COMPLETE = true
            end_round()
            return true
        end
    end
}))`;

  return {
    statement: `__PRE_RETURN_CODE__${WinBlindCode}__PRE_RETURN_CODE_END__`,
    message: customMessage ? `"${customMessage}"` : `"Win!"`,
    colour: "G.C.ORANGE"
  }
};
