# Context

Ce projet concerne un jeu de cartes de combat.
Chaque joueur a 5 cartes en main, chacune avec un attribut de vie, de dégat, de defense et de vitesse.

# Algorithme

Un affrontement entre deux cartes se déroule comme suit:
L'attaquant attaque une des cartes d l'autre joueur. Les dégats sont la différence entre les dégats de l'attaquant et la defense de la carte attaqué. La carte est battu lorsque sa vie atteint 0.

# Objectif ajouter les coups critiques

Nous souhaitons ajouter à la mécanique existante la notion de coup critique. Une coup critique est une attaques pour laquelle les dégats sont multipliés par deux. Un coup critique a une faible probabilité d'arriver. Cette probabilité dépend peut varier d'une carte à l'autre.

# Requête

En tant que game developpeur expérimenté sur les jeux de combat je voudrai que tu propose une modification du code existant pour intégrer les coups critiques.
