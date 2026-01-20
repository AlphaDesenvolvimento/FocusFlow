document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. NAVEGAÇÃO E MODO CLARO/ESCURO
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const themeBtn = document.querySelector('.theme-toggle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            item.classList.add('active');
            const activeView = document.getElementById(`view-${target}`);
            if (activeView) activeView.classList.add('active');

            if (target === 'painel') updateDashboard();
        });
    });

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            const icon = themeBtn.querySelector('.icon');
            if (icon) icon.textContent = isLight ? '🌙' : '☼';
            
            const textSpan = themeBtn.querySelector('span:not(.icon)') || themeBtn.childNodes[2];
            if (textSpan) textSpan.textContent = isLight ? ' Modo Escuro' : ' Modo Claro';
            
            localStorage.setItem('focus_flow_theme', isLight ? 'light' : 'dark');
        });
    }

    if (localStorage.getItem('focus_flow_theme') === 'light') {
        document.body.classList.add('light-mode');
        const icon = themeBtn?.querySelector('.icon');
        if (icon) icon.textContent = '🌙';
    }

    // ==========================================
    // 2. VARIÁVEIS GLOBAIS E ESTADO
    // ==========================================
    let themes = JSON.parse(localStorage.getItem('focus_flow_themes')) || [
        {name: "Geral", color: "#3b82f6"},
        {name: "Santuário Jardim da Imaculada", color: "#a855f7"},
        {name: "Grupo de Acólitos", color: "#14b8a6"},
        {name: "Namorada", color: "#ef4444"}
    ];

    let selectedColor = "#3b82f6";
    let selectedCategoryIdea = "Geral"; 
    let currentFilterIdea = "Todos";    
    let selectedPriority = "Baixa"; 
    let currentTaskFilter = "ativas";   

    let themeToDelete = null;
    let ideaToDelete = null;
    let taskToDelete = null;

    // ==========================================
    // 3. GERENCIAMENTO DE MODAIS
    // ==========================================
    const modalTheme = document.getElementById('modal-container');
    const modalConfirm = document.getElementById('modal-confirm-container');
    const modalDetails = document.getElementById('modal-details-container');

    const openConfirmModal = (title, themeName = null, ideaId = null, taskId = null) => {
        document.getElementById('confirm-title').textContent = title;
        themeToDelete = themeName;
        ideaToDelete = ideaId;
        taskToDelete = taskId;
        modalConfirm.classList.add('active');
    };

    const closeConfirmModal = () => {
        modalConfirm.classList.remove('active');
        themeToDelete = ideaToDelete = taskToDelete = null;
    };

    document.querySelectorAll('#btn-cancel-delete, #close-confirm-modal').forEach(btn => {
        btn?.addEventListener('click', closeConfirmModal);
    });

    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
        if (themeToDelete) {
            themes = themes.filter(t => t.name !== themeToDelete);
            localStorage.setItem('focus_flow_themes', JSON.stringify(themes));
            if (selectedCategoryIdea === themeToDelete) selectedCategoryIdea = "Geral";
            renderThemesIdeas();
            renderFiltersIdeas();
            updateTaskThemesList();
        } else if (ideaToDelete) {
            let ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
            ideas = ideas.filter(i => i.id !== ideaToDelete);
            localStorage.setItem('focus_flow_ideas', JSON.stringify(ideas));
            renderIdeasList();
        } else if (taskToDelete) {
            let tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
            tasks = tasks.filter(t => t.id !== taskToDelete);
            localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
            renderTasksList();
            updateDashboard();
        }
        closeConfirmModal();
    });

    const openDetailsModal = (task) => {
        const themeObj = themes.find(t => t.name === task.theme) || { color: '#3b82f6' };
        const pColor = task.priority === "Alta" ? "#ef4444" : (task.priority === "Média" ? "#f59e0b" : "#10b981");

        document.getElementById('view-details-title').textContent = task.title;
        document.getElementById('view-details-date').textContent = task.date;
        document.getElementById('view-details-desc').textContent = task.description || "Nenhuma observação.";

        const completedGroup = document.getElementById('completed-info-group');
        const completedText = document.getElementById('view-details-completed-at');

        if (task.completed && task.completedAt) {
            if (completedGroup) completedGroup.style.display = 'block';
            if (completedText) completedText.textContent = task.completedAt;
        } else {
            if (completedGroup) completedGroup.style.display = 'none';
        }

        const detTheme = document.getElementById('view-details-theme');
        detTheme.textContent = task.theme;
        detTheme.style.backgroundColor = themeObj.color + '22';
        detTheme.style.color = themeObj.color;

        const detPriority = document.getElementById('view-details-priority');
        detPriority.textContent = task.priority;
        detPriority.style.backgroundColor = pColor + '22';
        detPriority.style.color = pColor;

        modalDetails.classList.add('active');
    };

    document.querySelectorAll('#close-details-modal, #btn-close-details').forEach(btn => {
        btn?.addEventListener('click', () => modalDetails.classList.remove('active'));
    });

    // ==========================================
    // 4. LÓGICA DE TEMAS
    // ==========================================
    const themeNameInput = document.getElementById('theme-name-input');
    const colorDots = document.querySelectorAll('.color-dot');

    const saveNewTheme = () => {
        const name = themeNameInput.value.trim();
        if (name && !themes.find(t => t.name === name)) {
            themes.push({ name: name, color: selectedColor });
            localStorage.setItem('focus_flow_themes', JSON.stringify(themes));
            themeNameInput.value = "";
            modalTheme.classList.remove('active');
            renderThemesIdeas();
            renderFiltersIdeas();
            updateTaskThemesList();
        }
    };

    document.querySelectorAll('#btn-new-theme, #btn-new-theme-tasks').forEach(btn => {
        btn?.addEventListener('click', () => modalTheme.classList.add('active'));
    });
    document.getElementById('close-modal')?.addEventListener('click', () => modalTheme.classList.remove('active'));
    document.getElementById('btn-save-theme')?.addEventListener('click', saveNewTheme);

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
            selectedColor = dot.getAttribute('data-color');
        });
    });

    // ==========================================
    // 5. SEÇÃO DE IDEIAS (COM AJUSTE DO ENTER)
    // ==========================================
    const ideaInput = document.getElementById('idea-input');

    function renderThemesIdeas() {
        const container = document.getElementById('category-pills');
        if (!container) return;
        container.innerHTML = '';
        themes.forEach(theme => {
            const pill = document.createElement('span');
            pill.className = `pill ${theme.name === selectedCategoryIdea ? 'active' : ''}`;
            pill.style.setProperty('--theme-color-bg', theme.color);
            if (theme.name === selectedCategoryIdea) {
                pill.style.backgroundColor = theme.color;
                pill.style.color = "#ffffff";
            }
            pill.innerHTML = `${theme.name} <span class="delete-theme">&times;</span>`;
            pill.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-theme')) return;
                selectedCategoryIdea = theme.name;
                renderThemesIdeas();
            });
            pill.querySelector('.delete-theme').addEventListener('click', (e) => {
                e.stopPropagation();
                openConfirmModal(`Apagar o tema "${theme.name}"?`, theme.name);
            });
            container.appendChild(pill);
        });
    }

    function renderFiltersIdeas() {
        const container = document.getElementById('filter-pills-ideias');
        if (!container) return;
        container.innerHTML = '';
        const options = [{name: "Todos", color: "#3b82f6"}, ...themes];
        options.forEach(theme => {
            const pill = document.createElement('span');
            pill.className = `pill ${theme.name === currentFilterIdea ? 'active' : ''}`;
            pill.textContent = theme.name;
            pill.style.setProperty('--theme-color-bg', theme.color);
            if (theme.name === currentFilterIdea) {
                pill.style.backgroundColor = theme.color;
                pill.style.color = "#ffffff";
            }
            pill.addEventListener('click', () => {
                currentFilterIdea = theme.name;
                renderFiltersIdeas();
                renderIdeasList();
            });
            container.appendChild(pill);
        });
    }

    function renderIdeasList() {
        const container = document.getElementById('ideas-list');
        if (!container) return;
        container.innerHTML = '';
        const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
        const filtered = ideas.filter(i => currentFilterIdea === "Todos" || i.category === currentFilterIdea);
        
        filtered.slice().reverse().forEach(idea => {
            const themeData = themes.find(t => t.name === idea.category) || {color: "#94a3b8"};
            const div = document.createElement('div');
            div.className = 'idea-card';
            div.innerHTML = `
                <div class="idea-header">
                    <span class="idea-category-pill" style="background-color: ${themeData.color}22; color: ${themeData.color};">
                        ${idea.category}
                    </span>
                    <span class="idea-date">${idea.date}</span>
                    <button class="btn-delete"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
                <p class="idea-content">${idea.content}</p>
            `;
            div.querySelector('.btn-delete').addEventListener('click', () => openConfirmModal("Apagar este pensamento?", null, idea.id));
            container.appendChild(div);
        });
    }

    const captureIdea = () => {
        if (ideaInput.value.trim()) {
            const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
            ideas.push({ id: Date.now(), content: ideaInput.value.trim(), category: selectedCategoryIdea, date: new Date().toLocaleDateString('pt-BR') });
            localStorage.setItem('focus_flow_ideas', JSON.stringify(ideas));
            ideaInput.value = "";
            renderIdeasList();
        }
    };

    document.getElementById('btn-capture')?.addEventListener('click', captureIdea);
    ideaInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); captureIdea(); } });

    // ==========================================
    // 6. SEÇÃO DE TAREFAS (VALIDAÇÃO E ADIÇÃO)
    // ==========================================
    const taskInput = document.getElementById('task-input');
    const taskDateInput = document.getElementById('task-date');
    const taskThemeSelect = document.getElementById('task-theme-select');
    const taskDescInput = document.getElementById('task-desc-input');
    const tasksList = document.getElementById('tasks-list');
    const priorityButtons = document.querySelectorAll('.priority-btn');

    priorityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPriority = btn.getAttribute('data-priority');
        });
    });

    function updateTaskThemesList() {
        if (!taskThemeSelect) return;
        taskThemeSelect.innerHTML = themes.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    }

    taskDateInput?.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length >= 2) {
            let day = parseInt(v.substring(0, 2));
            if (day > 31) day = 31;
            if (day === 0 && v.length === 2) day = 1;
            v = String(day).padStart(2, '0') + v.substring(2);
        }
        if (v.length >= 4) {
            let month = parseInt(v.substring(2, 4));
            if (month > 12) month = 12;
            if (month === 0) month = 1;
            v = v.substring(0, 2) + String(month).padStart(2, '0');
        }
        if (v.length > 2) v = v.substring(0, 2) + "/" + v.substring(2, 4);
        e.target.value = v;
    });

    taskDateInput?.addEventListener('blur', (e) => {
        const val = e.target.value;
        if (val.length < 5) return;
        const parts = val.split('/');
        let d = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        const anoAtual = new Date().getFullYear();
        const isBissexto = (anoAtual % 4 === 0 && anoAtual % 100 !== 0) || (anoAtual % 400 === 0);
        const daysInMonth = [31, isBissexto ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (d > daysInMonth[m - 1]) d = daysInMonth[m - 1];
        e.target.value = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    });

    const addTask = () => {
        const title = taskInput?.value.trim();
        if (!title) { alert("Por favor, digite o nome da tarefa."); return; }

        const newTask = {
            id: Date.now(),
            title: title,
            description: taskDescInput ? taskDescInput.value.trim() : "Nenhuma observação.",
            theme: taskThemeSelect ? taskThemeSelect.value : "Geral",
            priority: selectedPriority,
            date: taskDateInput.value.trim() || "Hoje",
            completed: false
        };

        const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        tasks.push(newTask);
        localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
        
        taskInput.value = ""; 
        if (taskDateInput) taskDateInput.value = "";
        if (taskDescInput) taskDescInput.value = "";
        
        priorityButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('.priority-btn[data-priority="Baixa"]')?.classList.add('active');
        selectedPriority = "Baixa";

        renderTasksList(); 
        updateDashboard();
    };

    document.getElementById('btn-add-task')?.addEventListener('click', addTask);
    taskInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } });

    function renderTasksList() {
        if (!tasksList) return;
        tasksList.innerHTML = '';
        const allTasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const filtered = allTasks.filter(t => currentTaskFilter === "ativas" ? !t.completed : t.completed);

        filtered.slice().reverse().forEach(task => {
            const pColor = task.priority === "Alta" ? "#ef4444" : (task.priority === "Média" ? "#f59e0b" : "#10b981");
            const div = document.createElement('div');
            div.className = `task-item ${task.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="task-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-info">
                        <span class="task-title">${task.title}</span>
                        <div class="task-meta">
                            <span style="color: ${pColor}">● ${task.priority}</span>
                            <span>📅 ${task.date}</span>
                        </div>
                    </div>
                </div>
                <div class="task-right">
                    <button class="btn-details-task">👁</button>
                    <button class="btn-delete-task">🗑</button>
                </div>
            `;
            
            div.querySelector('.task-checkbox').addEventListener('change', () => {
                const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
                const updated = tasks.map(t => { 
                    if (t.id === task.id) {
                        t.completed = !t.completed;
                        if (t.completed) {
                            const agora = new Date();
                            t.completedAt = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} às ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
                        } else { delete t.completedAt; }
                    }
                    return t; 
                });
                localStorage.setItem('focus_flow_tasks', JSON.stringify(updated));
                setTimeout(() => { renderTasksList(); updateDashboard(); renderCalendar(); }, 200);
            });

            div.querySelector('.btn-details-task').addEventListener('click', () => openDetailsModal(task));
            div.querySelector('.btn-delete-task').addEventListener('click', () => openConfirmModal(`Excluir a tarefa "${task.title}"?`, null, null, task.id));
            tasksList.appendChild(div);
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.getAttribute('data-filter');
            renderTasksList();
        });
    });

    // ==========================================
    // 7. PAINEL (HOME) - ATUALIZAÇÃO E APRESENTAÇÃO
    // ==========================================

    function updateDashboard() {
        const allTasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const hojeStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        const dashboardDate = document.getElementById('dashboard-date');
        if (dashboardDate) {
            const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
            dashboardDate.textContent = new Date().toLocaleDateString('pt-BR', opcoes);
        }

        const tasksHoje = allTasks.filter(t => t.date === hojeStr || t.date === "Hoje");
        const pendentes = tasksHoje.filter(t => !t.completed);
        const concluidas = tasksHoje.filter(t => t.completed);
        
        if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pendentes.length;
        if (document.getElementById('stat-completed')) document.getElementById('stat-completed').textContent = concluidas.length;
        
        const total = tasksHoje.length;
        const porcentagem = total === 0 ? 0 : Math.round((concluidas.length / total) * 100);
        if (document.getElementById('progress-percentage')) document.getElementById('progress-percentage').textContent = porcentagem + '%';
        if (document.querySelector('.progress-fill')) document.querySelector('.progress-fill').style.width = porcentagem + '%';

        const focusCard = document.getElementById('focus-task-card');
        if (focusCard && pendentes.length > 0) {
            const tarefaPrioritaria = pendentes.sort((a, b) => {
                const peso = { "Alta": 3, "Média": 2, "Baixa": 1 };
                return peso[b.priority] - peso[a.priority];
            })[0];

            focusCard.style.display = 'block';
            document.getElementById('focus-task-title').textContent = tarefaPrioritaria.title;
            document.getElementById('focus-task-theme').textContent = `🎨 ${tarefaPrioritaria.theme}`;
            
            const btnFocus = document.getElementById('btn-complete-focus');
            btnFocus.onclick = () => marcarTarefaComoConcluida(tarefaPrioritaria.id);
        } else if (focusCard) {
            focusCard.style.display = 'none';
        }

        renderHomeTasks(tasksHoje);
    }

    function renderHomeTasks(tasks) {
        const container = document.getElementById('today-tasks-list');
        const countLabel = document.getElementById('task-count-label');
        
        if (!container) return;
        if (countLabel) countLabel.textContent = `${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`;

        container.innerHTML = '';

        if (tasks.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">Nada para hoje! ✨</p>';
            return;
        }

        // CARDS ESTRUTURADOS PARA A HOME
        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `home-task-item ${task.completed ? 'completed' : ''}`;
            
            const pColor = task.priority === "Alta" ? "var(--accent-red)" : 
                           (task.priority === "Média" ? "#f59e0b" : "var(--accent-blue)");
            div.style.borderLeftColor = pColor;

            div.innerHTML = `
                <div class="home-task-info">
                    <input type="checkbox" onchange="window.alternarTarefa(${task.id})" ${task.completed ? 'checked' : ''}>
                    <div class="home-task-meta">
                        <span class="home-task-theme-tag">${task.theme}</span>
                        <span class="home-task-title">${task.title}</span>
                    </div>
                </div>
                <div class="home-task-priority-dot" style="width: 8px; height: 8px; border-radius: 50%; background: ${pColor}"></div>
            `;
            container.appendChild(div);
        });
    }

    function marcarTarefaComoConcluida(taskId) {
        const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const updated = tasks.map(t => {
            if (t.id === taskId) {
                t.completed = true;
                const agora = new Date();
                t.completedAt = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} às ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
            }
            return t;
        });
        localStorage.setItem('focus_flow_tasks', JSON.stringify(updated));
        updateDashboard(); renderTasksList(); renderCalendar();
    }

    // ==========================================
    // 8. LÓGICA DO CALENDÁRIO (FIX VISÃO SEMANA/MÊS)
    // ==========================================
    let dateContext = new Date();
    let isMonthView = false;

    const calendarElements = {
        grid: document.getElementById('calendar-grid'),
        monthDisplay: document.getElementById('month-display'),
        toggleText: document.getElementById('toggle-text'),
        toggleIcon: document.getElementById('toggle-icon'),
        modal: document.getElementById('modal-day-tasks'),
        modalList: document.getElementById('day-tasks-list'),
        modalTitle: document.getElementById('day-tasks-title')
    };

    const getPriorityColor = (priority) => {
        const colors = { 'Alta': 'var(--accent-red)', 'Média': '#f59e0b', 'Baixa': 'var(--accent-blue)' };
        return colors[priority] || colors['Baixa'];
    };

    function renderCalendar() {
        const { grid, monthDisplay, toggleText, toggleIcon } = calendarElements;
        if (!grid || !monthDisplay) return;

        grid.innerHTML = '';
        const allTasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const hoje = new Date();
        const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(dateContext);
        monthDisplay.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${dateContext.getFullYear()}`;

        if (isMonthView) {
            const year = dateContext.getFullYear();
            const month = dateContext.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 0; i < firstDayOfMonth; i++) {
                const empty = document.createElement('div');
                empty.className = 'day-card other-month';
                grid.appendChild(empty);
            }
            for (let day = 1; day <= lastDateOfMonth; day++) { createDayCard(day, month, year, allTasks, grid, hoje); }
        } else {
            const startOfWeek = new Date(dateContext);
            startOfWeek.setDate(dateContext.getDate() - dateContext.getDay());
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                createDayCard(currentDay.getDate(), currentDay.getMonth(), currentDay.getFullYear(), allTasks, grid, hoje);
            }
        }
        if (toggleText) toggleText.textContent = isMonthView ? 'Ver Semana' : 'Ver Mês';
        if (toggleIcon) toggleIcon.textContent = isMonthView ? '▲' : '▼';
    }

    function createDayCard(day, month, year, allTasks, container, hoje) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        if (day === hoje.getDate() && month === hoje.getMonth() && year === hoje.getFullYear()) dayCard.classList.add('today');
        dayCard.innerHTML = `<span class="day-number">${day}</span>`;
        const dataFormatada = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
        const tarefasDoDia = allTasks.filter(t => t.date === dataFormatada);
        if (tarefasDoDia.length > 0) {
            const indicatorContainer = document.createElement('div');
            indicatorContainer.className = 'cal-task-indicators';
            tarefasDoDia.forEach(task => {
                const dot = document.createElement('div');
                dot.className = 'task-dot';
                dot.style.backgroundColor = getPriorityColor(task.priority);
                indicatorContainer.appendChild(dot);
            });
            dayCard.appendChild(indicatorContainer);
            dayCard.addEventListener('click', () => openDayTasksModal(dataFormatada, tarefasDoDia));
        }
        container.appendChild(dayCard);
    }

    function openDayTasksModal(data, tarefas) {
        const { modal, modalList, modalTitle } = calendarElements;
        modalTitle.textContent = `Tarefas de ${data}`;
        modalList.innerHTML = '';
        tarefas.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            item.style.borderLeft = `4px solid ${getPriorityColor(task.priority)}`;
            item.innerHTML = `<div class="task-info"><span class="task-title">${task.title}</span><small style="color:var(--text-muted)">${task.theme}</small></div><button class="btn-details-task">👁</button>`;
            item.querySelector('.btn-details-task').addEventListener('click', (e) => { e.stopPropagation(); openDetailsModal(task); });
            modalList.appendChild(item);
        });
        modal.classList.add('active');
    }

    const setupCalendarEvents = () => {
        document.getElementById('btn-toggle-view')?.addEventListener('click', () => { isMonthView = !isMonthView; renderCalendar(); });
        document.getElementById('prev-month')?.addEventListener('click', () => { if (isMonthView) dateContext.setMonth(dateContext.getMonth() - 1); else dateContext.setDate(dateContext.getDate() - 7); renderCalendar(); });
        document.getElementById('next-month')?.addEventListener('click', () => { if (isMonthView) dateContext.setMonth(dateContext.getMonth() + 1); else dateContext.setDate(dateContext.getDate() + 7); renderCalendar(); });
        document.getElementById('btn-today-cal')?.addEventListener('click', () => { dateContext = new Date(); renderCalendar(); });
        document.getElementById('close-day-tasks')?.addEventListener('click', () => calendarElements.modal.classList.remove('active'));
        document.getElementById('btn-done-day')?.addEventListener('click', () => calendarElements.modal.classList.remove('active'));
    };

    // --- FUNÇÃO GLOBAL PARA CHECKBOXES ---
    window.alternarTarefa = (id) => {
        const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const updated = tasks.map(t => {
            if (t.id === id) {
                t.completed = !t.completed;
                if (t.completed) {
                    const agora = new Date();
                    t.completedAt = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} às ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
                } else { delete t.completedAt; }
            }
            return t;
        });
        localStorage.setItem('focus_flow_tasks', JSON.stringify(updated));
        updateDashboard(); renderTasksList(); renderCalendar();
    };

    // ==========================================
    // 9. INICIALIZAÇÃO
    // ==========================================
    renderThemesIdeas(); 
    renderFiltersIdeas(); 
    renderIdeasList();
    updateTaskThemesList(); 
    renderTasksList(); 
    updateDashboard();
    renderCalendar(); 
    setupCalendarEvents();
});