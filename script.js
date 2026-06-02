const form = document.querySelector('#ideaForm');
const feedback = document.querySelector('#feedback');
const fields = [...document.querySelectorAll('textarea')];
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
}

const setFeedback = (message, type = 'success') => {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', type === 'error');
};

fields.forEach((field) => {
  field.addEventListener('input', () => {
    field.classList.remove('is-invalid');
    setFeedback('');
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const ideas = fields.map((field) => field.value.trim());
  const invalidField = fields.find((field) => field.value.trim().length < 20);

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
      savedAt: new Date().toISOString(),
    })
  );

  setFeedback('Idées enregistrées localement. Compare maintenant l’urgence, le budget et l’accès aux premiers clients.');
});
