import json

def main():
    actionConfig = [("Deal Breaker", 5, 'Steal a complete set of properties'), ("Just Say No", 3, 'Use when an action is played against you'), ("Sly Deal", 1, 'Steal a non-full-set property'), ("Forced Deal", 3, 'Swap any property with another'), ("Debt Collector", 3, 'Force any player to pay you 5M'), ("Hotel", 4, 'Add to a full set to add 4M in rent value'), ("House", 3, 'Add to a full set to add 3M in rent value'), ("It's My Birthday!", 2, 'All players give you 2M as a gift'), ("Double The Rent", 1, 'Charge double the rent on the next rent card this turn'), ("Pass Go", 1, 'Draw 2 extra cards')]
    actionCards = [{ 'type': 'action', 'title': title, 'value': value, 'description': description } for title, value, description in actionConfig]
    moneyConfig = [10, 5, 4, 3, 2, 1]
    moneyCards = [{ 'type': 'money', 'value': v } for v in moneyConfig]
    rentConfig = [('rainbow', 3), (['blue', 'green'], 1), (['yellow', 'red'], 1), (['orange', 'pink'], 1), (['black', 'light_green'], 1), (['light_blue', 'brown'], 1)]
    rentCards = [{ 'type': 'rent', 'color': color, 'value': value, 'description': 'Charges one player rent' if color == 'rainbow' else 'Charges other players rent of either color'} for color, value in rentConfig]
    propertyConfig = [('blue', 4, [3,8]), ('green', 4, [2,4,7]), ('yellow', 3, [2,4,6]), ('red', 3, [2,3,6]), ('orange', 2, [1,3,5]), ('pink', 2, [1,2,4]), ('black', 1, [1,2,3,4]), ('light_blue', 1, [1,2,3]), ('brown', 1, [1,3]), ('light_green', 1, [1,2])]
    propertyCards = [{ 'type': 'property', 'color': color, 'value': value, 'stages': stages } for color, value, stages in propertyConfig]
    wildcardConfig = [('rainbow', 0), (['green', 'blue'], 4), (['red', 'yellow'], 3), (['orange', 'pink'], 2), (['green', 'black'], 4), (['black', 'light_blue'], 4), (['black', 'light_green'], 2), (['light_blue', 'brown'], 1)]
    wildCards = [{ 'type': 'property', 'color': color, 'value': value} for color, value in wildcardConfig]
    allCards = [*propertyCards, *wildCards, *rentCards, *actionCards, *moneyCards]
    with open('cards.json', 'w') as cardsFile:
        cardsFile.write(json.dumps([{ 'id': i, **card } for i, card in enumerate(allCards)]))

if __name__ == '__main__':
    main()