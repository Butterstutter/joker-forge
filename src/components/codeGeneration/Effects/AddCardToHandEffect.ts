import type { Effect } from "../../ruleBuilder/types";
import type { EffectReturn } from "../effectUtils";
import { EDITIONS, SEALS, type JokerData } from "../../data/BalatroUtils";
import { parseRankVariable, parseSuitVariable } from "../Jokers/variableUtils";

export const generateAddCardToHandEffectCode = (
  effect: Effect,
  itemType: string,
  triggerType: string,
  modprefix: string,
  joker?: JokerData,
): EffectReturn => {
  switch(itemType) {
    case "joker":
      return generateJokerCode(effect, triggerType, modprefix, joker)
    default:
      return {
        statement: "",
        colour: "G.C.WHITE",
      };
  }
}

const generateJokerCode = (
  effect: Effect,
  triggerType: string, 
  modprefix: string,
  joker?: JokerData,
): EffectReturn => {
  const suit = (effect.params?.suit as string) || "random";
  const rank = (effect.params?.rank as string) || "random";
  const enhancement = (effect.params?.enhancement as string) || "none";
  const seal = (effect.params?.seal as string) || "none";
  const edition = (effect.params?.edition as string) || "none";

  const customMessage = effect.customMessage;

  const scoringTriggers = ["hand_played", "card_scored"];
  const heldInHandTriggers = ["card_held_in_hand"];

  const isScoring = scoringTriggers.includes(triggerType);
  const isHeldInHand = heldInHandTriggers.includes(triggerType);

  const rankVar = parseRankVariable((effect.params?.rank as string) || "", joker);
  const suitVar = parseSuitVariable((effect.params?.suit as string) || "", joker);

  let cardSelectionCode = "";

  if (suit === "random" && rank === "random") {
    cardSelectionCode += "local card_front = pseudorandom_element(G.P_CARDS, pseudoseed('add_card_hand'))";
  } else {
    const suitCode = suitVar.isSuitVariable ? suitVar.code : `'${suit.charAt(0)}'`
    const rankCode = rankVar.isRankVariable ? rankVar.code : `'${rank.charAt(0)}'`

    if (suitCode === 'r') { 
      cardSelectionCode += `
        suit_prefix = pseudorandom_element({'H','S','D','C'}, "random_suit")`
    } else {
      cardSelectionCode += `
        suit_prefix = ${suitCode}`
    }

    if (rankCode === 'r') { 
      cardSelectionCode += `
        rank_suffix = pseudorandom_element({'2','3','4','5','6','7','8','9','T','J','Q','K','A'}, "random_rank")`
    } else {
      cardSelectionCode += `
        rank_suffix = ${rankCode}`
    }

    cardSelectionCode += `
      local card_front = G.P_CARDS[suit_prefix..rank_suffix]`
  }

  let centerParam = "";
  if (enhancement === "none") {
    centerParam = `
    G.P_CENTERS.c_base`;
  } else if (enhancement === "random") {
    centerParam =`
      pseudorandom_element({G.P_CENTERS.m_gold, G.P_CENTERS.m_steel, G.P_CENTERS.m_glass, G.P_CENTERS.m_wild, G.P_CENTERS.m_mult, G.P_CENTERS.m_lucky, G.P_CENTERS.m_stone}, pseudoseed('add_card_hand_enhancement'))`;
  } else {
    centerParam = `
    G.P_CENTERS.${enhancement}`;
  }

  let sealCode = "";
  if (seal === "random") {
    const sealPool = SEALS().map(seal => `'${seal.value}'`)
    sealCode = `
      new_card:set_seal(pseudorandom_element({${sealPool}}, pseudoseed('add_card_hand_seal')), true)`;
  } else if (seal !== "none") {
    sealCode = `
      new_card:set_seal("${seal}", true)`;
  }

  let editionCode = "";
  if (edition === "random") {
    const editionPool = EDITIONS().map(edition => `'${
      edition.key.startsWith('e_') ? edition.key : `e_${modprefix}_${edition.key}`}'`)    
       editionCode = `
      new_card:set_edition(pseudorandom_element({${editionPool}}, pseudoseed('add_card_hand_edition')), true)`;
  } else if (edition !== "none") {
    editionCode = `
      new_card:set_edition("${edition}", true)`;
  }

  if (isScoring || isHeldInHand) {
    return {
      statement: `__PRE_RETURN_CODE__
                ${cardSelectionCode}
                local new_card = create_playing_card({
                    front = card_front,
                    center = ${centerParam}
                }, G.discard, true, false, nil, true)${sealCode.replace(
                  /new_card/g,
                  "new_card"
                )}${editionCode.replace(/new_card/g, "new_card")}
                
                G.playing_card = (G.playing_card and G.playing_card + 1) or 1
                new_card.playing_card = G.playing_card
                table.insert(G.playing_cards, new_card)
                
                G.E_MANAGER:add_event(Event({
                    func = function() 
                        G.hand:emplace(new_card)
                        new_card:start_materialize()
                        return true
                    end
                }))
                __PRE_RETURN_CODE_END__`,
      message: customMessage ? `"${customMessage}"` : '"Added Card to Hand!"',
      colour: "G.C.GREEN",
    };
  } else {
    return {
      statement: `func = function()
                ${cardSelectionCode}
                local new_card = create_playing_card({
                    front = card_front,
                    center = ${centerParam}
                }, G.discard, true, false, nil, true)${sealCode.replace(
                  /new_card/g,
                  "new_card"
                )}${editionCode.replace(/new_card/g, "new_card")}
                
                G.playing_card = (G.playing_card and G.playing_card + 1) or 1
                new_card.playing_card = G.playing_card
                table.insert(G.playing_cards, new_card)
                
                G.E_MANAGER:add_event(Event({
                    func = function()
                        G.hand:emplace(new_card)
                        new_card:start_materialize()
                        SMODS.calculate_context({ playing_card_added = true, cards = { new_card } })
                        return true
                    end
                }))
            end`,
      message: customMessage ? `"${customMessage}"` : '"Added Card to Hand!"',
      colour: "G.C.GREEN",
    };
  }
}