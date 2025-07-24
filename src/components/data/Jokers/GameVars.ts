import {
  RectangleStackIcon,
  CreditCardIcon,
  SparklesIcon,
  FaceSmileIcon,
  PlayIcon,
  BanknotesIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export interface GameVariable {
  id: string;
  label: string;
  description: string;
  category: string;
  subcategory?: string;
  code: string;
}

export interface GameVariableSubcategory {
  id: string;
  label: string;
  variables: GameVariable[];
}

export interface GameVariableCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variables: GameVariable[];
  subcategories?: GameVariableSubcategory[];
}

export const GAME_VARIABLE_CATEGORIES: GameVariableCategory[] = [
  {
    id: "deck",
    label: "Deck & Cards",
    icon: RectangleStackIcon,
    variables: [
      {
        id: "cards_in_deck",
        label: "Cards in Deck",
        description: "Number of cards currently in the deck pile",
        category: "deck",
        code: "#(G.deck and G.deck.cards or {})",
      },
      {
        id: "total_playing_cards",
        label: "Total Playing Cards",
        description: "Total playing cards in the game",
        category: "deck",
        code: "#(G.playing_cards or {})",
      },
      {
        id: "current_hand_size",
        label: "Current Hand Size",
        description: "Current hand size",
        category: "deck",
        code: "(G.hand and G.hand.config.card_limit or 0)",
      },
      {
        id: "cards_removed_from_deck",
        label: "Cards Removed From Deck",
        description: "Number of cards removed from starting deck",
        category: "deck",
        code: "(G.GAME.starting_deck_size - #(G.playing_cards or {}))",
      },
      {
        id: "cards_in_hand",
        label: "Cards in Hand",
        description: "Number of cards currently in hand",
        category: "deck",
        code: "#(G.hand and G.hand.cards or {})",
      },
      {
        id: "cards_in_discard",
        label: "Cards in Discard",
        description: "Number of cards in discard pile",
        category: "deck",
        code: "#(G.discard and G.discard.cards or {})",
      },
    ],
    subcategories: [
      {
        id: "hand_analysis",
        label: "Hand Analysis",
        variables: [
          {
            id: "lowest_rank_in_hand",
            label: "Lowest Rank in Hand",
            description: "Rank value of the lowest card in hand",
            category: "deck",
            subcategory: "hand_analysis",
            code: "(function() local min = 14; for _, card in ipairs(G.hand and G.hand.cards or {}) do if card.base.id < min then min = card.base.id end end; return min end)()",
          },
          {
            id: "highest_rank_in_hand",
            label: "Highest Rank in Hand",
            description: "Rank value of the highest card in hand",
            category: "deck",
            subcategory: "hand_analysis",
            code: "(function() local max = 0; for _, card in ipairs(G.hand and G.hand.cards or {}) do if card.base.id > max then max = card.base.id end end; return max end)()",
          },
        ],
      },
      {
        id: "deck_composition_ranks",
        label: "Deck Composition - Ranks",
        variables: [
          {
            id: "twos_in_deck",
            label: "2s in Deck",
            description: "Number of 2s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 2 then count = count + 1 end end; return count end)()",
          },
          {
            id: "threes_in_deck",
            label: "3s in Deck",
            description: "Number of 3s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 3 then count = count + 1 end end; return count end)()",
          },
          {
            id: "fours_in_deck",
            label: "4s in Deck",
            description: "Number of 4s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 4 then count = count + 1 end end; return count end)()",
          },
          {
            id: "fives_in_deck",
            label: "5s in Deck",
            description: "Number of 5s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 5 then count = count + 1 end end; return count end)()",
          },
          {
            id: "sixes_in_deck",
            label: "6s in Deck",
            description: "Number of 6s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 6 then count = count + 1 end end; return count end)()",
          },
          {
            id: "sevens_in_deck",
            label: "7s in Deck",
            description: "Number of 7s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 7 then count = count + 1 end end; return count end)()",
          },
          {
            id: "eights_in_deck",
            label: "8s in Deck",
            description: "Number of 8s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 8 then count = count + 1 end end; return count end)()",
          },
          {
            id: "nines_in_deck",
            label: "9s in Deck",
            description: "Number of 9s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 9 then count = count + 1 end end; return count end)()",
          },
          {
            id: "tens_in_deck",
            label: "10s in Deck",
            description: "Number of 10s in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 10 then count = count + 1 end end; return count end)()",
          },
          {
            id: "jacks_in_deck",
            label: "Jacks in Deck",
            description: "Number of Jacks in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 11 then count = count + 1 end end; return count end)()",
          },
          {
            id: "queens_in_deck",
            label: "Queens in Deck",
            description: "Number of Queens in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 12 then count = count + 1 end end; return count end)()",
          },
          {
            id: "kings_in_deck",
            label: "Kings in Deck",
            description: "Number of Kings in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 13 then count = count + 1 end end; return count end)()",
          },
          {
            id: "aces_in_deck",
            label: "Aces in Deck",
            description: "Number of Aces in full deck",
            category: "deck",
            subcategory: "deck_composition_ranks",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.id == 14 then count = count + 1 end end; return count end)()",
          },
        ],
      },
      {
        id: "deck_composition_suits",
        label: "Deck Composition - Suits",
        variables: [
          {
            id: "spades_in_deck",
            label: "Spades in Deck",
            description: "Number of Spades in full deck",
            category: "deck",
            subcategory: "deck_composition_suits",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.suit == 'Spades' then count = count + 1 end end; return count end)()",
          },
          {
            id: "hearts_in_deck",
            label: "Hearts in Deck",
            description: "Number of Hearts in full deck",
            category: "deck",
            subcategory: "deck_composition_suits",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.suit == 'Hearts' then count = count + 1 end end; return count end)()",
          },
          {
            id: "diamonds_in_deck",
            label: "Diamonds in Deck",
            description: "Number of Diamonds in full deck",
            category: "deck",
            subcategory: "deck_composition_suits",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.suit == 'Diamonds' then count = count + 1 end end; return count end)()",
          },
          {
            id: "clubs_in_deck",
            label: "Clubs in Deck",
            description: "Number of Clubs in full deck",
            category: "deck",
            subcategory: "deck_composition_suits",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.base.suit == 'Clubs' then count = count + 1 end end; return count end)()",
          },
        ],
      },
      {
        id: "deck_composition_enhancements",
        label: "Deck Composition - Enhancements",
        variables: [
          {
            id: "bonus_cards_in_deck",
            label: "Bonus Cards in Deck",
            description: "Number of Bonus cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_bonus') then count = count + 1 end end; return count end)()",
          },
          {
            id: "mult_cards_in_deck",
            label: "Mult Cards in Deck",
            description: "Number of Mult cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_mult') then count = count + 1 end end; return count end)()",
          },
          {
            id: "wild_cards_in_deck",
            label: "Wild Cards in Deck",
            description: "Number of Wild cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_wild') then count = count + 1 end end; return count end)()",
          },
          {
            id: "glass_cards_in_deck",
            label: "Glass Cards in Deck",
            description: "Number of Glass cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_glass') then count = count + 1 end end; return count end)()",
          },
          {
            id: "steel_cards_in_deck",
            label: "Steel Cards in Deck",
            description: "Number of Steel cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_steel') then count = count + 1 end end; return count end)()",
          },
          {
            id: "stone_cards_in_deck",
            label: "Stone Cards in Deck",
            description: "Number of Stone cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_stone') then count = count + 1 end end; return count end)()",
          },
          {
            id: "gold_cards_in_deck",
            label: "Gold Cards in Deck",
            description: "Number of Gold cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_gold') then count = count + 1 end end; return count end)()",
          },
          {
            id: "lucky_cards_in_deck",
            label: "Lucky Cards in Deck",
            description: "Number of Lucky cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if SMODS.has_enhancement(card, 'm_lucky') then count = count + 1 end end; return count end)()",
          },
          {
            id: "enhanced_cards_in_deck",
            label: "Enhanced Cards in Deck",
            description: "Total number of enhanced cards in full deck",
            category: "deck",
            subcategory: "deck_composition_enhancements",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if next(SMODS.get_enhancements(card)) then count = count + 1 end end; return count end)()",
          },
        ],
      },
      {
        id: "deck_composition_editions",
        label: "Deck Composition - Editions",
        variables: [
          {
            id: "foil_cards_in_deck",
            label: "Foil Cards in Deck",
            description: "Number of Foil cards in full deck",
            category: "deck",
            subcategory: "deck_composition_editions",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.edition and card.edition.foil then count = count + 1 end end; return count end)()",
          },
          {
            id: "holographic_cards_in_deck",
            label: "Holographic Cards in Deck",
            description: "Number of Holographic cards in full deck",
            category: "deck",
            subcategory: "deck_composition_editions",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.edition and card.edition.holo then count = count + 1 end end; return count end)()",
          },
          {
            id: "polychrome_cards_in_deck",
            label: "Polychrome Cards in Deck",
            description: "Number of Polychrome cards in full deck",
            category: "deck",
            subcategory: "deck_composition_editions",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.edition and card.edition.polychrome then count = count + 1 end end; return count end)()",
          },
          {
            id: "negative_cards_in_deck",
            label: "Negative Cards in Deck",
            description: "Number of Negative cards in full deck",
            category: "deck",
            subcategory: "deck_composition_editions",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.edition and card.edition.negative then count = count + 1 end end; return count end)()",
          },
        ],
      },
      {
        id: "deck_composition_seals",
        label: "Deck Composition - Seals",
        variables: [
          {
            id: "gold_sealed_cards_in_deck",
            label: "Gold Sealed Cards in Deck",
            description: "Number of Gold sealed cards in full deck",
            category: "deck",
            subcategory: "deck_composition_seals",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.seal == 'Gold' then count = count + 1 end end; return count end)()",
          },
          {
            id: "red_sealed_cards_in_deck",
            label: "Red Sealed Cards in Deck",
            description: "Number of Red sealed cards in full deck",
            category: "deck",
            subcategory: "deck_composition_seals",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.seal == 'Red' then count = count + 1 end end; return count end)()",
          },
          {
            id: "blue_sealed_cards_in_deck",
            label: "Blue Sealed Cards in Deck",
            description: "Number of Blue sealed cards in full deck",
            category: "deck",
            subcategory: "deck_composition_seals",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.seal == 'Blue' then count = count + 1 end end; return count end)()",
          },
          {
            id: "purple_sealed_cards_in_deck",
            label: "Purple Sealed Cards in Deck",
            description: "Number of Purple sealed cards in full deck",
            category: "deck",
            subcategory: "deck_composition_seals",
            code: "(function() local count = 0; for _, card in ipairs(G.playing_cards or {}) do if card.seal == 'Purple' then count = count + 1 end end; return count end)()",
          },
        ],
      },
    ],
  },
  {
    id: "consumables",
    label: "Consumables",
    icon: CreditCardIcon,
    variables: [
      {
        id: "consumables_held",
        label: "Consumables Held",
        description: "Number of consumables currently held",
        category: "consumables",
        code: "#(G.consumeables and G.consumeables.cards or {})",
      },
      {
        id: "consumable_slots",
        label: "Consumable Slots",
        description: "Total number of consumable slots available",
        category: "consumables",
        code: "G.consumeables and G.consumeables.config.card_limit or 0",
      },
      {
        id: "free_consumable_slots",
        label: "Free Consumable Slots",
        description: "Number of empty consumable slots",
        category: "consumables",
        code: "(G.consumeables and G.consumeables.config.card_limit or 0 - #(G.consumeables and G.consumeables.cards or {}))",
      },
    ],
    subcategories: [
      {
        id: "consumable_usage",
        label: "Consumable Usage",
        variables: [
          {
            id: "tarot_cards_used",
            label: "Tarot Cards Used",
            description: "Total number of Tarot cards used this run",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(G.GAME.consumeable_usage_total and G.GAME.consumeable_usage_total.tarot or 0)",
          },
          {
            id: "spectral_cards_used",
            label: "Spectral Cards Used",
            description: "Total number of Spectral cards used this run",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(G.GAME.consumeable_usage_total and G.GAME.consumeable_usage_total.spectral or 0)",
          },
          {
            id: "planet_cards_used",
            label: "Planet Cards Used",
            description: "Total number of Planet cards used this run",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(G.GAME.consumeable_usage_total and G.GAME.consumeable_usage_total.planet or 0)",
          },
          {
            id: "unique_tarots_used",
            label: "Unique Tarot Cards Used",
            description: "Number of unique Tarot cards used",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(function() local count = 0; for k, v in pairs(G.GAME.consumeable_usage) do if v.set == 'Tarot' then count = count + 1 end end; return count end)()",
          },
          {
            id: "unique_planets_used",
            label: "Unique Planet Cards Used",
            description: "Number of unique Planet cards used",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(function() local count = 0; for k, v in pairs(G.GAME.consumeable_usage) do if v.set == 'Planet' then count = count + 1 end end; return count end)()",
          },
          {
            id: "unique_spectrals_used",
            label: "Unique Spectral Cards Used",
            description: "Number of unique Spectral cards used",
            category: "consumables",
            subcategory: "consumable_usage",
            code: "(function() local count = 0; for k, v in pairs(G.GAME.consumeable_usage) do if v.set == 'Spectral' then count = count + 1 end end; return count end)()",
          },
        ],
      },
    ],
  },
  {
    id: "jokers",
    label: "Jokers",
    icon: FaceSmileIcon,
    variables: [
      {
        id: "joker_count",
        label: "Joker Count",
        description: "Number of jokers currently held",
        category: "jokers",
        code: "#(G.jokers and G.jokers.cards or {})",
      },
      {
        id: "joker_slots",
        label: "Total Joker Slots",
        description: "Total number of joker slots available",
        category: "jokers",
        code: "G.jokers and G.jokers.config.card_limit or 0",
      },
      {
        id: "free_joker_slots",
        label: "Free Joker Slots",
        description: "Number of empty joker slots",
        category: "jokers",
        code: "(G.jokers and G.jokers.config.card_limit or 0 - #(G.jokers and G.jokers.cards or {}))",
      },
    ],
    subcategories: [
      {
        id: "joker_rarities",
        label: "Jokers by Rarity",
        variables: [
          {
            id: "common_jokers",
            label: "Common Jokers",
            description: "Number of Common rarity jokers owned",
            category: "jokers",
            subcategory: "joker_rarities",
            code: "(function() local count = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do if joker.config.center.rarity == 1 then count = count + 1 end end; return count end)()",
          },
          {
            id: "uncommon_jokers",
            label: "Uncommon Jokers",
            description: "Number of Uncommon rarity jokers owned",
            category: "jokers",
            subcategory: "joker_rarities",
            code: "(function() local count = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do if joker.config.center.rarity == 2 then count = count + 1 end end; return count end)()",
          },
          {
            id: "rare_jokers",
            label: "Rare Jokers",
            description: "Number of Rare rarity jokers owned",
            category: "jokers",
            subcategory: "joker_rarities",
            code: "(function() local count = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do if joker.config.center.rarity == 3 then count = count + 1 end end; return count end)()",
          },
          {
            id: "legendary_jokers",
            label: "Legendary Jokers",
            description: "Number of Legendary rarity jokers owned",
            category: "jokers",
            subcategory: "joker_rarities",
            code: "(function() local count = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do if joker.config.center.rarity == 4 then count = count + 1 end end; return count end)()",
          },
        ],
      },
      {
        id: "joker_economics",
        label: "Joker Economics",
        variables: [
          {
            id: "other_jokers_sell_value",
            label: "Other Jokers Sell Value",
            description: "Combined sell value of all other jokers",
            category: "jokers",
            subcategory: "joker_economics",
            code: "(function() local total = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do if joker ~= card then total = total + joker.sell_cost end end; return total end)()",
          },
          {
            id: "all_jokers_sell_value",
            label: "All Jokers Sell Value",
            description: "Combined sell value of all jokers",
            category: "jokers",
            subcategory: "joker_economics",
            code: "(function() local total = 0; for _, joker in ipairs(G.jokers and G.jokers.cards or {}) do total = total + joker.sell_cost end; return total end)()",
          },
        ],
      },
    ],
  },
  {
    id: "poker_hands",
    label: "Poker Hands",
    icon: PlayIcon,
    variables: [
      {
        id: "current_hand_played_count",
        label: "Current Hand Played Count",
        description: "Times the currently played hand has been played",
        category: "poker_hands",
        code: "G.GAME.hands[context.scoring_name].played",
      },
      {
        id: "total_hand_levels",
        label: "Total Hand Levels",
        description: "Sum of all poker hand levels",
        category: "poker_hands",
        code: "(function() local total = 0; for hand, data in pairs(G.GAME.hands) do if data.level >= to_big(1) then total = total + data.level end end; return total end)()",
      },
      {
        id: "hand_levels_above_one",
        label: "Hand Levels Above One",
        description: "Total levels minus base level for each hand",
        category: "poker_hands",
        code: "(function() local total_levels = 0; local total_hands = 0; for hand, data in pairs(G.GAME.hands) do if data.level >= to_big(1) then total_hands = total_hands + 1; total_levels = total_levels + data.level end end; return total_levels - total_hands end)()",
      },
    ],
    subcategories: [
      {
        id: "hand_play_counts",
        label: "Hand Play Counts",
        variables: [
          {
            id: "high_card_played",
            label: "High Card Played",
            description: "Number of times High Card has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['High Card'].played",
          },
          {
            id: "pair_played",
            label: "Pair Played",
            description: "Number of times Pair has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Pair'].played",
          },
          {
            id: "two_pair_played",
            label: "Two Pair Played",
            description: "Number of times Two Pair has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Two Pair'].played",
          },
          {
            id: "three_of_a_kind_played",
            label: "Three of a Kind Played",
            description: "Number of times Three of a Kind has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Three of a Kind'].played",
          },
          {
            id: "straight_played",
            label: "Straight Played",
            description: "Number of times Straight has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Straight'].played",
          },
          {
            id: "flush_played",
            label: "Flush Played",
            description: "Number of times Flush has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Flush'].played",
          },
          {
            id: "full_house_played",
            label: "Full House Played",
            description: "Number of times Full House has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Full House'].played",
          },
          {
            id: "four_of_a_kind_played",
            label: "Four of a Kind Played",
            description: "Number of times Four of a Kind has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Four of a Kind'].played",
          },
          {
            id: "straight_flush_played",
            label: "Straight Flush Played",
            description: "Number of times Straight Flush has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Straight Flush'].played",
          },
          {
            id: "royal_flush_played",
            label: "Royal Flush Played",
            description: "Number of times Royal Flush has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Royal Flush'].played",
          },
          {
            id: "five_of_a_kind_played",
            label: "Five of a Kind Played",
            description: "Number of times Five of a Kind has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Five of a Kind'].played",
          },
          {
            id: "flush_house_played",
            label: "Flush House Played",
            description: "Number of times Flush House has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Flush House'].played",
          },
          {
            id: "flush_five_played",
            label: "Flush Five Played",
            description: "Number of times Flush Five has been played",
            category: "poker_hands",
            subcategory: "hand_play_counts",
            code: "G.GAME.hands['Flush Five'].played",
          },
        ],
      },
    ],
  },
  {
    id: "game_state",
    label: "Game State",
    icon: ChartBarIcon,
    variables: [
      {
        id: "current_ante",
        label: "Current Ante",
        description: "Current ante level",
        category: "game_state",
        code: "G.GAME.round_resets.ante",
      },
      {
        id: "current_money",
        label: "Current Money",
        description: "Current amount of money",
        category: "game_state",
        code: "G.GAME.dollars",
      },
      {
        id: "hands_remaining",
        label: "Hands Remaining",
        description: "Number of hands left this round",
        category: "game_state",
        code: "G.GAME.current_round.hands_left",
      },
      {
        id: "discards_remaining",
        label: "Discards Remaining",
        description: "Number of discards left this round",
        category: "game_state",
        code: "G.GAME.current_round.discards_left",
      },
      {
        id: "hands_played_this_round",
        label: "Hands Played This Round",
        description: "Number of hands played this round",
        category: "game_state",
        code: "G.GAME.current_round.hands_played",
      },
      {
        id: "discards_used_this_round",
        label: "Discards Used This Round",
        description: "Number of discards used this round",
        category: "game_state",
        code: "G.GAME.current_round.discards_used",
      },
      {
        id: "blinds_skipped",
        label: "Blinds Skipped",
        description: "Total number of blinds skipped this run",
        category: "game_state",
        code: "G.GAME.skips",
      },
      {
        id: "base_hands_per_round",
        label: "Base Hands Per Round",
        description: "Base number of hands per round",
        category: "game_state",
        code: "G.GAME.round_resets.hands",
      },
      {
        id: "base_discards_per_round",
        label: "Base Discards Per Round",
        description: "Base number of discards per round",
        category: "game_state",
        code: "G.GAME.round_resets.discards",
      },
    ],
  },
  {
    id: "money_thresholds",
    label: "Money Thresholds",
    icon: BanknotesIcon,
    variables: [],
    subcategories: [
      {
        id: "money_intervals",
        label: "Money Intervals",
        variables: [
          {
            id: "money_per_5",
            label: "Money ÷ 5",
            description: "Current money divided by 5 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 5)",
          },
          {
            id: "money_per_10",
            label: "Money ÷ 10",
            description: "Current money divided by 10 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 10)",
          },
          {
            id: "money_per_15",
            label: "Money ÷ 15",
            description: "Current money divided by 15 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 15)",
          },
          {
            id: "money_per_20",
            label: "Money ÷ 20",
            description: "Current money divided by 20 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 20)",
          },
          {
            id: "money_per_25",
            label: "Money ÷ 25",
            description: "Current money divided by 25 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 25)",
          },
          {
            id: "money_per_30",
            label: "Money ÷ 30",
            description: "Current money divided by 30 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 30)",
          },
          {
            id: "money_per_40",
            label: "Money ÷ 40",
            description: "Current money divided by 40 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 40)",
          },
          {
            id: "money_per_50",
            label: "Money ÷ 50",
            description: "Current money divided by 50 (rounded down)",
            category: "money_thresholds",
            subcategory: "money_intervals",
            code: "math.floor(G.GAME.dollars / 50)",
          },
        ],
      },
    ],
  },
  {
    id: "special",
    label: "Special",
    icon: SparklesIcon,
    variables: [],
    subcategories: [
      {
        id: "hand_position",
        label: "Hand Position",
        variables: [
          {
            id: "leftmost_card_rank",
            label: "Leftmost Card Rank",
            description: "Rank of the leftmost card in hand",
            category: "special",
            subcategory: "hand_position",
            code: "(G.hand and G.hand.cards[1] and G.hand.cards[1].base.id or 0)",
          },
          {
            id: "rightmost_card_rank",
            label: "Rightmost Card Rank",
            description: "Rank of the rightmost card in hand",
            category: "special",
            subcategory: "hand_position",
            code: "(G.hand and G.hand.cards[#G.hand.cards] and G.hand.cards[#G.hand.cards].base.id or 0)",
          },
          {
            id: "highest_card_mult",
            label: "Highest Card Mult",
            description: "Mult value from the highest rank card in hand",
            category: "special",
            subcategory: "hand_position",
            code: "(function() local max = 0; for _, card in ipairs(G.hand and G.hand.cards or {}) do if card.base.id > max then max = card.base.id end end; return max end)()",
          },
          {
            id: "lowest_card_mult",
            label: "Lowest Card Mult",
            description: "Mult value from the lowest rank card in hand",
            category: "special",
            subcategory: "hand_position",
            code: "(function() local min = 14; for _, card in ipairs(G.hand and G.hand.cards or {}) do if card.base.id < min then min = card.base.id end end; return min end)()",
          },
        ],
      },
    ],
  },
];

export const getAllGameVariables = (): GameVariable[] => {
  const allVariables: GameVariable[] = [];

  GAME_VARIABLE_CATEGORIES.forEach((category) => {
    allVariables.push(...category.variables);
    if (category.subcategories) {
      category.subcategories.forEach((subcategory) => {
        allVariables.push(...subcategory.variables);
      });
    }
  });

  return allVariables;
};

export const getGameVariableById = (id: string): GameVariable | undefined => {
  return getAllGameVariables().find((variable) => variable.id === id);
};

export const getGameVariablesByCategory = (
  categoryId: string
): GameVariable[] => {
  const category = GAME_VARIABLE_CATEGORIES.find(
    (cat) => cat.id === categoryId
  );
  return category ? category.variables : [];
};

export const getGameVariablesBySubcategory = (
  categoryId: string,
  subcategoryId: string
): GameVariable[] => {
  const category = GAME_VARIABLE_CATEGORIES.find(
    (cat) => cat.id === categoryId
  );
  if (!category?.subcategories) return [];

  const subcategory = category.subcategories.find(
    (sub) => sub.id === subcategoryId
  );
  return subcategory ? subcategory.variables : [];
};
