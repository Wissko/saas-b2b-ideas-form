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

Le formulaire essaie d’abord d’envoyer les données via la route backend `/api/submit` avec Resend. Si l’API n’est pas disponible, il ouvre automatiquement un email pré-rempli en fallback vers `Wissem.sghaier.ws@gmail.com`, afin de ne pas perdre les informations.

Variables d’environnement à configurer en production pour l’envoi automatique :

```bash
RESEND_API_KEY=...
RESEND_FROM="SaaS B2B Ideas <adresse@domaine-verifie.com>"
SUBMISSION_TO_EMAIL="Wissem.sghaier.ws@gmail.com"
```

L’email contient :

- le contact éventuel
- la date d’envoi
- un résumé automatique des deux idées
- les deux idées séparées et lisibles
- une lecture rapide avec la longueur de chaque idée
- une prochaine étape recommandée pour comparer les pistes

## Vérifier

```bash
npm run check
```
