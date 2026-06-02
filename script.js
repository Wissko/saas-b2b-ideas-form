const form = document.querySelector('#ideaForm');
const feedback = document.querySelector('#feedback');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const ideas = {
    ideaOne: data.get('ideaOne').trim(),
    ideaTwo: data.get('ideaTwo').trim(),
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem('saas-b2b-ideas', JSON.stringify(ideas));
  feedback.textContent = 'Idées enregistrées localement. Prochaine étape : choisir celle qui résout le problème le plus urgent.';
});
