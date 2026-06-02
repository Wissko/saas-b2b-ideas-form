const form = document.querySelector('#ideaForm');
const feedback = document.querySelector('#feedback');
const fields = [...document.querySelectorAll('textarea')];
const contactEmail = document.querySelector('#contactEmail');
const submittedAtField = document.querySelector('#submittedAt');
const summaryField = document.querySelector('#summaryField');
const nextStepField = document.querySelector('#nextStepField');
const structuredMessageField = document.querySelector('#structuredMessageField');
const submitButton = form.querySelector('button[type="submit"]');
const storageKey = 'saas-b2b-ideas';
const fallbackEmail = 'Wissem.sghaier.ws@gmail.com';

let savedIdeas = null;

try {
  savedIdeas = JSON.parse(localStorage.getItem(storageKey) || 'null');
} catch {
  localStorage.removeItem(storageKey);
}

if (savedIdeas) {
  fields.forEach((field) => {
    field.value = savedIdeas[field.id] || '';
  });

  contactEmail.value = savedIdeas.email || '';
}

const setFeedback = (message, type = 'success') => {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', type === 'error');
};

const cleanText = (value) => value.replace(/\s+/g, ' ').trim();

const summarizeIdea = (idea) => {
  const normalized = cleanText(idea);
  const firstSentence = normalized.match(/^[^.!?]+[.!?]?/)?.[0] || normalized;

  if (firstSentence.length <= 150) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 147).trim()}...`;
};

const buildSummary = ([ideaOne, ideaTwo]) => {
  const summaryOne = summarizeIdea(ideaOne);
  const summaryTwo = summarizeIdea(ideaTwo);

  return `Deux pistes SaaS B2B ont été envoyées. Idée 1 : ${summaryOne} Idée 2 : ${summaryTwo}`;
};

const buildNextStep = ([ideaOne, ideaTwo]) => {
  const shortestIdea = ideaOne.length <= ideaTwo.length ? 'l’idée 1' : 'l’idée 2';

  return `Comparer les deux pistes avec 4 critères : douleur business, budget disponible, facilité de trouver les premiers clients, simplicité du MVP. Commencer par challenger ${shortestIdea}, car elle est formulée plus court et peut nécessiter plus de précision.`;
};

const buildStructuredMessage = ({ email, ideas, submittedAt, summary, nextStep }) => `
Nouvelle soumission - Idées SaaS B2B

Contact
- Email : ${email || 'Non renseigné'}
- Date : ${submittedAt}

Résumé automatique
${summary}

Idée SaaS B2B n°1
${ideas[0]}

Idée SaaS B2B n°2
${ideas[1]}

Lecture rapide
- Nombre de caractères idée 1 : ${ideas[0].length}
- Nombre de caractères idée 2 : ${ideas[1].length}

Prochaine étape recommandée
${nextStep}
`.trim();

const openMailFallback = ({ structuredMessage }) => {
  const subject = encodeURIComponent('Nouvelle soumission - Idées SaaS B2B');
  const body = encodeURIComponent(structuredMessage);
  window.location.href = `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;
};

const sendSubmission = async (payload) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Submission API unavailable');
  }

  return response.json();
};

[...fields, contactEmail].forEach((field) => {
  field.addEventListener('input', () => {
    field.classList.remove('is-invalid');
    setFeedback('');
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ideas = fields.map((field) => cleanText(field.value));
  const email = contactEmail.value.trim();
  const invalidField = fields.find((field) => cleanText(field.value).length < 20);

  if (email && !contactEmail.validity.valid) {
    contactEmail.classList.add('is-invalid');
    contactEmail.focus();
    setFeedback('Vérifie le format de l’adresse email, ou laisse le champ vide.', 'error');
    return;
  }

  if (invalidField) {
    invalidField.classList.add('is-invalid');
    invalidField.focus();
    setFeedback('Ajoute au moins une phrase claire pour chaque idée avant d’enregistrer.', 'error');
    return;
  }

  const submittedAt = new Date().toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const summary = buildSummary(ideas);
  const nextStep = buildNextStep(ideas);
  const structuredMessage = buildStructuredMessage({ email, ideas, submittedAt, summary, nextStep });
  const payload = {
    email,
    ideaOne: ideas[0],
    ideaTwo: ideas[1],
    submittedAt,
    summary,
    nextStep,
    structuredMessage,
  };

  submittedAtField.value = submittedAt;
  summaryField.value = summary;
  nextStepField.value = nextStep;
  structuredMessageField.value = structuredMessage;

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...payload,
      savedAt: new Date().toISOString(),
    })
  );

  submitButton.disabled = true;
  setFeedback('Envoi en cours. Une copie locale est sauvegardée.');

  try {
    await sendSubmission(payload);
    setFeedback('Idées enregistrées. Elles sont disponibles dans le panel admin.');
  } catch {
    setFeedback('Stockage indisponible ici. Ouverture d’un email pré-rempli pour ne pas perdre les infos.', 'error');
    openMailFallback({ structuredMessage });
  } finally {
    submitButton.disabled = false;
  }
});
