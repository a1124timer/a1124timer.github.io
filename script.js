const addSubjectButton = document.getElementById('addSubjectButton');
const modal = document.getElementById('modal');
const saveSubjectButton = document.getElementById('saveSubject');
const closeModalButton = document.getElementById('closeModal');
const subjectList = document.getElementById('subjectList');
const subjectNameInput = document.getElementById('subjectName');
const timeGoalInput = document.getElementById('timeGoal');

// Подсказка для новых пользователей
const isFirstVisit = !localStorage.getItem('visited');
if (isFirstVisit) {
  const guide = document.createElement('div');
  guide.classList.add('guide');
  guide.innerHTML = `
    <div class="arrow">⬆</div>
    <p>Нажмите "+", чтобы добавить предметы</p>
  `;
  document.body.appendChild(guide);

  // Убираем подсказку через 5 секунд
  setTimeout(() => {
    guide.remove();
  }, 5000);
  localStorage.setItem('visited', 'true');
}

let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

// Открытие модального окна
addSubjectButton.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

// Закрытие модального окна
closeModalButton.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Сохранение предмета
saveSubjectButton.addEventListener('click', () => {
  const name = subjectNameInput.value.trim();
  const goal = parseFloat(timeGoalInput.value.trim());

  if (name && goal > 0) {
    subjects.push({ name, goal, totalTime: 0, startTime: null, history: [] });
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    subjectNameInput.value = '';
    timeGoalInput.value = '';
    modal.classList.add('hidden');
  }
});

// Удаление предмета
function deleteSubject(index) {
  subjects.splice(index, 1);
  localStorage.setItem('subjects', JSON.stringify(subjects));
  renderSubjects();
}

// Рассчёт прошедшего времени
function calculateElapsedTime(subject) {
  const now = Date.now();
  if (subject.startTime) {
    return subject.totalTime + (now - subject.startTime) / 1000;
  }
  return subject.totalTime;
}

// Форматирование времени
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}ч ${mins}м ${secs}с`;
}

// Шкала прогресса
function calculateProgress(subject) {
  const elapsedTime = calculateElapsedTime(subject) / 3600;
  const percentage = Math.min((elapsedTime / subject.goal) * 100, 100);
  return percentage;
}

// Обновление истории занятий
function updateHistory(subject, elapsedTime) {
  if (!subject.history) {
    subject.history = [];
  }
  subject.history.unshift(elapsedTime);
  if (subject.history.length > 3) {
    subject.history.pop();
  }
}

// Отрисовка списка предметов
function renderSubjects() {
  subjectList.innerHTML = '';
  subjects.forEach((subject, index) => {
    const elapsedTime = calculateElapsedTime(subject);
    const progress = calculateProgress(subject);
    const div = document.createElement('div');
    div.className = 'subject';
    div.innerHTML = `
      <div class="subject-header">
        <h3>${subject.name}</h3>
        <span>${formatTime(elapsedTime)}</span>
        <button class="delete-button" onclick="deleteSubject(${index})">&times;</button>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
      <div class="progress-percent">${progress.toFixed(1)}%</div>
      <div class="subject-footer">
        <button onclick="toggleTimer(${index})" class="${subject.startTime ? 'stop' : ''}">
          ${subject.startTime ? 'Закончить заниматься' : 'Начать заниматься'}
        </button>
      </div>
      <div class="history">
        <h4>Последние занятия:</h4>
        <ul>
          ${subject.history?.map(time => `<li>${formatTime(time)}</li>`).join('') || '<li>Пока нет данных</li>'}
        </ul>
      </div>
    `;
    subjectList.appendChild(div);
  });
}

// Запуск/остановка таймера
function toggleTimer(index) {
  const now = Date.now();
  const subject = subjects[index];

  if (subject.startTime) {
    const elapsed = (now - subject.startTime) / 1000; // Время в секундах
    subject.totalTime += elapsed;
    updateHistory(subject, elapsed);
    subject.startTime = null;
  } else {
    subject.startTime = now;
  }

  localStorage.setItem('subjects', JSON.stringify(subjects));
  renderSubjects();
}

// Автообновление таймеров каждые 1 секунду
setInterval(() => {
  renderSubjects();
}, 1000);

// Инициализация
renderSubjects();