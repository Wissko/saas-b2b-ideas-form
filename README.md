# Deux idées SaaS B2B

Mini landing statique pour cadrer deux idées de projet SaaS B2B et expliquer pourquoi le B2B peut être plus stratégique qu’une approche B2C au départ.

## Contenu

- Une seule page HTML responsive
- Un formulaire avec email optionnel + deux champs d’idées SaaS B2B
- Une explication claire des avantages B2B : budget, douleur, rétention, volume
- Validation simple côté client
- Envoi des soumissions par email via FormSubmit
- Sauvegarde locale des réponses via `localStorage`

## Lancer le projet

Ouvrir directement `index.html` dans un navigateur, ou lancer un serveur local :

```bash
npm start
```

Puis ouvrir `http://localhost:3000`.

## Réception des soumissions

Le formulaire envoie les données à `Wissem.sghaier.ws@gmail.com` via FormSubmit. Au premier envoi réel, FormSubmit peut envoyer un email de confirmation à accepter pour activer la réception.

## Vérifier

```bash
npm run check
```
