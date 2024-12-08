const addSubjectButton = document.getElementById('addSubjectButton');
const modal = document.getElementById('modal');
const saveSubjectButton = document.getElementById('saveSubject');
const closeModalButton = document.getElementById('closeModal');
const subjectList = document.getElementById('subjectList');
const subjectNameInput = document.getElementById('subjectName');
const timeGoalInput = document.getElementById('timeGoal');
const detailsModal = document.getElementById('detailsModal');
const detailsCloseButton = document.getElementById('detailsCloseButton');
const detailsTableBody = document.getElementById('detailsTableBody');

let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

addSubjectButton.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

closeModalButton.addEventListener('click', () => {
  modal.classList.add('hidden');
});

detailsCloseButton.addEventListener('click', () => {
  detailsModal.classList.add('hidden');
});

saveSubjectButton.addEventListener('click', () => {
  const name = subjectNameInput.value.trim();
  const goal = parseFloat(timeGoalInput.value.trim());

  if (name && goal > 0) {
    subjects.push({ name, goal, totalTime: 0, startTime: null, currentSessionStartTime: null, history: [] });
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    subjectNameInput.value = '';
    timeGoalInput.value = '';
    modal.classList.add('hidden');
  }
});

function deleteSubject(index) {
  subjects.splice(index, 1);
  localStorage.setItem('subjects', JSON.stringify(subjects));
  renderSubjects();
}

function calculateElapsedTime(subject) {
  const now = Date.now();
  let totalElapsed = subject.totalTime;

  if (subject.currentSessionStartTime) {
    totalElapsed += (now - subject.currentSessionStartTime) / 1000;
  }
  
  return totalElapsed;
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}ч ${mins}м ${secs}с`;
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function renderRecentActivities(subject) {
  const recentActivities = subject.history.slice(-3);
  return recentActivities.map((entry) => 
    `<li>
      <span>${formatTime(entry.duration)}</span>
      <span>${formatDateTime(entry.end)}</span>
    </li>`
  ).join('');
}

function renderSubjects() {
  subjectList.innerHTML = '';
  subjects.forEach((subject, index) => {
    const elapsedTime = calculateElapsedTime(subject);
    const progress = Math.min((elapsedTime / 3600 / subject.goal) * 100, 100);
    const div = document.createElement('div');
    
    const totalTimeFormatted = formatTime(subject.totalTime);
    const currentSessionTimeFormatted = subject.currentSessionStartTime ? formatTime((Date.now() - subject.currentSessionStartTime) / 1000) : '';

    div.className = 'subject';
    div.innerHTML = 
      `<div class="subject-header">
        <h3>${subject.name}</h3>
        <span>Общее время: ${totalTimeFormatted}</span>
        <button class="delete-button" onclick="deleteSubject(${index})">&times;</button>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
      <div class="progress-percent">
        ${progress.toFixed(1)}% | Цель: ${subject.goal} ч
      </div>
      <div class="subject-footer">
        ${subject.currentSessionStartTime ? 
          `<div class="current-session-timer">Текущее занятие: ${currentSessionTimeFormatted}</div>` : ''}
        <button onclick="toggleTimer(${index})" class="${subject.startTime || subject.currentSessionStartTime ? 'stop' : ''}">
          ${subject.startTime || subject.currentSessionStartTime ? 'Закончить заниматься' : 'Начать заниматься'}
        </button>
      </div>
      <div class="subject-recent-activities">
        <h4>Последние занятия:</h4>
        <ul>
          ${renderRecentActivities(subject)}
        </ul>
      </div>`;
    
    div.addEventListener('click', (event) => {
      if (event.target.closest('.subject-footer') || event.target.closest('.delete-button')) return;
      openDetails(index);
    });

    subjectList.appendChild(div);
  });
}

function updateHistory(subject, elapsedTime) {
  const now = Date.now();
  subject.history.push({
    duration: elapsedTime,
    start: now - elapsedTime * 1000,
    end: now,
  });
}

function openDetails(index) {
  const subject = subjects[index];
  detailsTableBody.innerHTML = subject.history
    .map(
      (entry, i) => 
      `<tr>
        <td>${i + 1}</td>
        <td>${formatTime(entry.duration)}</td>
        <td>${formatDateTime(entry.start)}</td>
        <td>${formatDateTime(entry.end)}</td>
      </tr>`
    )
    .join('') || '<tr><td colspan="4">Пока нет данных</td></tr>';
  detailsModal.classList.remove('hidden');
}

function toggleTimer(index) {
  const now = Date.now();
  const subject = subjects[index];

  if (subject.startTime || subject.currentSessionStartTime) {
    const elapsed = (now - (subject.startTime || subject.currentSessionStartTime)) / 1000;
    subject.totalTime += elapsed;
    updateHistory(subject, elapsed);
    subject.startTime = null;
    subject.currentSessionStartTime = null;
  } else {
    subject.currentSessionStartTime = now;
  }

  localStorage.setItem('subjects', JSON.stringify(subjects));
  renderSubjects();
}

setInterval(() => {
  renderSubjects();
}, 1000);

renderSubjects();
