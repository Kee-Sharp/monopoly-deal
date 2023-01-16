import json

def main():
    actionConfig = [("Deal Breaker", 5), ("Just Say No", 3), ("Sly Deal", 1), ("Forced Deal", 3), ("Debt Collector", 3), ("Hotel", 4), ("House", 3), ("It's My Birthday!", 2), ("Double The Rent", 1), ("Pass Go", 1)]
    actionCards = [{ 'type': 'action', 'title': title, 'value': value } for title, value in actionConfig]
    moneyConfig = [10, 5, 4, 3, 2, 1]
    moneyCards = [{ 'type': 'money', 'value': v } for v in moneyConfig]
    rentConfig = [('rainbow', 3), (['blue', 'green'], 1), (['yellow', 'red'], 1), (['orange', 'pink'], 1), (['black', 'light_green'], 1), (['light_blue', 'brown'], 1)]
    rentCards = [{ 'type': 'rent', 'color': color, 'value': value} for color, value in rentConfig]
    propertyConfig = [('blue', 4, [3,8]), ('green', 4, [2,4,7]), ('yellow', 3, [2,4,6]), ('red', 3, [2,3,6]), ('orange', 2, [1,3,5]), ('pink', 2, [1,2,4]), ('black', 1, [1,2,3,4]), ('light_blue', 1, [1,2,3]), ('light_green', 1, [1,2]), ('brown', 1, [1,2])]
    propertyCards = [{ 'type': 'property', 'color': color, 'value': value, 'stages': stages } for color, value, stages in propertyConfig]
    wildcardConfig = [(['blue', 'green'], 4), (['yellow', 'red'], 3), (['orange', 'pink'], 2), (['green', 'black'], 4), (['black', 'light_blue'], 4), (['black', 'light_green'], 2), ('rainbow', 0)]
    wildCards = [{ 'type': 'property', 'color': color, 'value': value} for color, value in wildcardConfig]
    allCards = [*propertyCards, *wildCards, *rentCards, *actionCards, *moneyCards]
    with open('cards.json', 'w') as cardsFile:
        cardsFile.write(json.dumps([{ 'id': i, **card } for i, card in enumerate(allCards)]))

if __name__ == '__main__':
    main()