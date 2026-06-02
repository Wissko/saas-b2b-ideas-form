const form = document.querySelector('#ideaForm');
const feedback = document.querySelector('#feedback');
const fields = [...document.querySelectorAll('textarea')];
const contactEmail = document.querySelector('#contactEmail');
const submitButton = form.querySelector('button[type="submit"]');
const storageKey = 'saas-b2b-ideas';

let savedIdeas = null;

try {
  savedIdeas = JSON.parse(localStorage.getItem(storageKey) || 'null');
} catch {
  localStorage.removeItem(storageKey);
}

if (savedIdeas) {
  fields.forEach((field) => {
    field.value = savedIdeas[field.name] || '';
  });

  contactEmail.value = savedIdeas.email || '';
}

const setFeedback = (message, type = 'success') => {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', type === 'error');
};

[...fields, contactEmail].forEach((field) => {
  field.addEventListener('input', () => {
    field.classList.remove('is-invalid');
    setFeedback('');
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const ideas = fields.map((field) => field.value.trim());
  const email = contactEmail.value.trim();
  const invalidField = fields.find((field) => field.value.trim().length < 20);

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

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ideaOne: ideas[0],
      ideaTwo: ideas[1],
      email,
      savedAt: new Date().toISOString(),
    })
  );

  submitButton.disabled = true;
  setFeedback('Envoi en cours. Une copie locale a aussi été sauvegardée.');
  form.submit();
});
