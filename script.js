const subjectList = document.getElementById("subjectList");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const addSubjectButton = document.getElementById("addSubjectButton");
const saveSubjectButton = document.getElementById("saveSubject");
const subjectNameInput = document.getElementById("subjectName");
const timeGoalInput = document.getElementById("timeGoal");
const detailsModal = document.getElementById("detailsModal");
const detailsCloseButton = document.getElementById("detailsCloseButton");
const detailsTableBody = document.getElementById("detailsTableBody");
const statisticsModal = document.getElementById("statisticsModal");
const statisticsCloseButton = document.getElementById("statisticsCloseButton");
const showStatisticsButton = document.getElementById("showStatisticsButton");
const totalTimeSpent = document.getElementById("totalTimeSpent");
const subjectChart = document.getElementById("subjectChart");
const maxTimeSubject = document.getElementById("maxTimeSubject");
const minTimeSubject = document.getElementById("minTimeSubject");

let subjects = JSON.parse(localStorage.getItem("subjects")) || [];
let intervalId = null;
let chart = null;

addSubjectButton.addEventListener("click", () => modal.classList.remove("hidden"));
closeModal.addEventListener("click", () => modal.classList.add("hidden"));
detailsCloseButton.addEventListener("click", () => detailsModal.classList.add("hidden"));
statisticsCloseButton.addEventListener("click", () => statisticsModal.classList.add("hidden"));

saveSubjectButton.addEventListener("click", () => {
  const name = subjectNameInput.value.trim();
  const goal = parseInt(timeGoalInput.value, 10);

  if (!name || isNaN(goal) || goal <= 0) {
    alert("Введите корректные данные!");
    return;
  }

  subjects.push({
    name,
    goal,
    totalTime: 0,
    currentSessionStartTime: null,
    history: [],
  });

  saveSubjects();
  renderSubjects();
  modal.classList.add("hidden");
  subjectNameInput.value = "";
  timeGoalInput.value = "";
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (event) => {
  // Отклоняем автоматическое появление панели установки
  event.preventDefault();
  
  deferredPrompt = event;
  
  const installButton = document.createElement('button');
  installButton.textContent = 'Установить приложение';
  document.body.appendChild(installButton);

  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Пользователь выбрал установить приложение');
      } else {
        console.log('Пользователь отклонил установку');
      }
      installButton.style.display = 'none';
    });
  });
});
 
function saveSubjects() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}ч ${minutes}м ${secs}с`;
}

function toggleTimer(index) {
  const subject = subjects[index];
  if (subject.currentSessionStartTime) {
    const now = Date.now();
    const elapsedTime = Math.floor((now - subject.currentSessionStartTime) / 1000);
    subject.totalTime += elapsedTime;

    subject.history.push({
      start: subject.currentSessionStartTime,
      end: now,
      duration: elapsedTime,
    });

    subject.currentSessionStartTime = null;
  } else {
    subject.currentSessionStartTime = Date.now();
  }

  saveSubjects();
  renderSubjects();
}

function deleteSubject(index) {
  if (confirm("Вы уверены, что хотите удалить этот предмет?")) {
    subjects.splice(index, 1);
    saveSubjects();
    renderSubjects();
  }
}

function renderSubjects() {
  subjectList.innerHTML = '';
  if (subjects.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.innerHTML = `
      <p>Нет предметов, нажмите <strong>+</strong>, чтобы добавить предмет.</p>
    `;
    subjectList.appendChild(emptyMessage);
    return;
  }

  subjects.forEach((subject, index) => {
    const elapsedTime = subject.totalTime;
    const progress = Math.min((elapsedTime / 3600 / subject.goal) * 100, 100);

    const currentSessionTime = subject.currentSessionStartTime
      ? Math.floor((Date.now() - subject.currentSessionStartTime) / 1000)
      : 0;

    const div = document.createElement('div');
    div.className = 'subject';
    div.innerHTML = `
      <div class="subject-header">
        <h3>${subject.name}</h3>
        <span>Общее время: <span id="total-time-${index}">${formatTime(elapsedTime)}</span></span>
        <button class="delete-button" onclick="deleteSubject(${index})">&times;</button>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
      <div class="progress-percent">${progress.toFixed(1)}% | Цель: ${subject.goal} ч</div>
      <div class="subject-footer">
        ${subject.currentSessionStartTime ? `<div class="current-session">Текущее занятие: <span id="current-time-${index}">${formatTime(elapsedTime + currentSessionTime)}</span></div>` : ''}
        <button onclick="toggleTimer(${index})" class="${subject.currentSessionStartTime ? 'stop' : ''}">
          ${subject.currentSessionStartTime ? 'Закончить заниматься' : 'Начать заниматься'}
        </button>
        ${renderRecentHistory(subject.history)}
      </div>
    `;
    div.addEventListener('click', (event) => {
      if (event.target.closest('.subject-footer') || event.target.closest('.delete-button')) return;
      openDetails(index);
    });
    subjectList.appendChild(div);
  });

  updateInitialTimers();
}

function updateInitialTimers() {
  subjects.forEach((subject, index) => {
    if (subject.currentSessionStartTime) {
      const elapsedTime = Math.floor((Date.now() - subject.currentSessionStartTime) / 1000);
      const totalTime = subject.totalTime + elapsedTime;

      const totalTimeElement = document.getElementById(`total-time-${index}`);
      const currentTimeElement = document.getElementById(`current-time-${index}`);

      if (totalTimeElement) totalTimeElement.textContent = formatTime(totalTime);
      if (currentTimeElement) currentTimeElement.textContent = formatTime(elapsedTime);
    }
  });
}

function startAutoUpdate() {
  intervalId = setInterval(() => {
    subjects.forEach((subject, index) => {
      if (subject.currentSessionStartTime) {
        const elapsedTime = Math.floor((Date.now() - subject.currentSessionStartTime) / 1000);
        const totalTime = subject.totalTime + elapsedTime;

        const currentTimeElement = document.getElementById(`current-time-${index}`);
        const totalTimeElement = document.getElementById(`total-time-${index}`);

        if (currentTimeElement) currentTimeElement.textContent = formatTime(elapsedTime);
        if (totalTimeElement) totalTimeElement.textContent = formatTime(totalTime);

        const progressElement = subjectList.querySelector(`.progress:nth-child(${index + 1})`);
        if (progressElement) {
          const progress = Math.min((totalTime / 3600 / subject.goal) * 100, 100);
          progressElement.style.width = `${progress}%`;
        }
      }
    });
  }, 1000);
}

function renderRecentHistory(history) {
  const recentHistory = history.slice(-3).map(entry => {
    const duration = formatTime(entry.duration);
    const startDate = new Date(entry.start).toLocaleString();
    return `<li>${duration} (${startDate})</li>`;
  }).join('');

  return recentHistory ? `
    <div class="recent-history">
      <h4>Последние занятия:</h4>
      <ul>${recentHistory}</ul>
    </div>` : '';
}

function openDetails(index) {
  const subject = subjects[index];
  detailsTableBody.innerHTML = subject.history.length
    ? subject.history.map((entry, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatTime(entry.duration)}</td>
        <td>${new Date(entry.start).toLocaleString()}</td>
        <td>${new Date(entry.end).toLocaleString()}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="4">Нет данных</td></tr>';
  detailsModal.classList.remove('hidden');
}

function openStatistics() {
  const totalTime = subjects.reduce((sum, subj) => sum + subj.totalTime, 0);
  totalTimeSpent.textContent = `Общее время занятий: ${formatTime(totalTime)}`;

  const sortedSubjects = [...subjects].sort((a, b) => b.totalTime - a.totalTime);

  if (sortedSubjects.length > 0) {
    maxTimeSubject.textContent = sortedSubjects[0].name || "Нет данных";
    const maxTimeElement = document.getElementById("maxTime");
    if (maxTimeElement) {
      maxTimeElement.textContent = formatTime(sortedSubjects[0].totalTime);
    }
  } else {
    maxTimeSubject.textContent = "Нет данных";
    const maxTimeElement = document.getElementById("maxTime");
    if (maxTimeElement) {
      maxTimeElement.textContent = "0:00:00";
    }
  }

  if (sortedSubjects.length > 1) {
    minTimeSubject.textContent = sortedSubjects[sortedSubjects.length - 1].name || "Нет данных";
    const minTimeElement = document.getElementById("minTime");
    if (minTimeElement) {
      minTimeElement.textContent = formatTime(sortedSubjects[sortedSubjects.length - 1].totalTime);
    }
  } else {
    minTimeSubject.textContent = "Нет данных";
    const minTimeElement = document.getElementById("minTime");
    if (minTimeElement) {
      minTimeElement.textContent = "0:00:00";
    }
  }

  const labels = subjects.map(subj => subj.name);
  const data = subjects.map(subj => subj.totalTime / 3600);

  if (chart) {
    chart.destroy();
  }

  renderChart(labels, data);

  statisticsModal.classList.remove("hidden");
  showStatisticsButton.disabled = true;

  statisticsCloseButton.addEventListener("click", () => {
    statisticsModal.classList.add("hidden");
    showStatisticsButton.disabled = false;
  });
}

showStatisticsButton.addEventListener("click", openStatistics);


function renderChart(labels, data) {
  chart = new Chart(subjectChart, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Часы занятий',
        data,
        backgroundColor: labels.map((_, i) => `hsl(${(i * 360) / labels.length}, 70%, 70%)`),
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => {
              const totalTime = context.raw;
              return `${context.label}: ${formatTime(totalTime * 3600)}`;
            },
          },
        },
      },
    },
  });
}

renderSubjects();
startAutoUpdate();
