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
    let ideaToTransform = null;
    let transformPriority = "Baixa"; 
    let filterFavoritesOnly = false; 

    // VARIÁVEIS DO CALENDÁRIO (Recuperadas para o código funcionar)
    let dateContext = new Date();
    let isMonthView = false;

    // ==========================================
    // FUNÇÕES UTILITÁRIAS
    // ==========================================
    function formatTextWithLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            const href = url.startsWith('http') ? url : `https://${url}`;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="idea-link">${url}</a>`;
        });
    }

    // ==========================================
    // 3. GERENCIAMENTO DE MODAIS
    // ==========================================
    const modalTheme = document.getElementById('modal-container');
    const modalConfirm = document.getElementById('modal-confirm-container');
    const modalDetails = document.getElementById('modal-details-container');
    const modalTransform = document.getElementById('modal-transform-container');

    window.openConfirmModal = (title, themeName = null, ideaId = null, taskId = null) => {
        document.getElementById('confirm-title').textContent = title;
        themeToDelete = themeName;
        ideaToDelete = ideaId;
        taskToDelete = taskId;
        modalConfirm.classList.add('active');
    };

    window.closeConfirmModal = () => {
        modalConfirm.classList.remove('active');
        themeToDelete = ideaToDelete = taskToDelete = null;
    };

    const closeTransformModal = () => {
        modalTransform?.classList.remove('active');
        ideaToTransform = null;
        transformPriority = "Baixa";
        document.querySelectorAll('#transform-priority-group .priority-btn-modal').forEach(b => {
            b.classList.remove('active');
            if(b.getAttribute('data-priority') === "Baixa") b.classList.add('active');
        });
    };

    document.querySelectorAll('#btn-cancel-delete, #close-confirm-modal').forEach(btn => {
        btn?.addEventListener('click', window.closeConfirmModal);
    });

    document.getElementById('close-transform-modal')?.addEventListener('click', closeTransformModal);
    document.getElementById('btn-cancel-transform')?.addEventListener('click', closeTransformModal);

    document.querySelectorAll('#transform-priority-group .priority-btn-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#transform-priority-group .priority-btn-modal').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            transformPriority = btn.getAttribute('data-priority');
        });
    });

    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
        if (themeToDelete) {
            themes = themes.filter(t => t.name !== themeToDelete);
            localStorage.setItem('focus_flow_themes', JSON.stringify(themes));
            renderThemesIdeas(); renderFiltersIdeas(); updateTaskThemesList();
        } else if (ideaToDelete) {
            let ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
            ideas = ideas.filter(i => i.id !== ideaToDelete);
            localStorage.setItem('focus_flow_ideas', JSON.stringify(ideas));
            renderIdeasList(); updateDashboard(); 
        } else if (taskToDelete) {
            let tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
            tasks = tasks.filter(t => t.id !== taskToDelete);
            localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
            renderTasksList(); updateDashboard(); renderCalendar();
        }
        window.closeConfirmModal();
    });

    document.getElementById('btn-confirm-transform')?.addEventListener('click', () => {
        if (!ideaToTransform) return;
        const dateVal = document.getElementById('transform-date').value.trim() || "Hoje";
        const descVal = document.getElementById('transform-desc').value.trim();

        const newTask = {
            id: Date.now(),
            title: ideaToTransform.content.substring(0, 30) + (ideaToTransform.content.length > 30 ? "..." : ""),
            description: descVal, theme: ideaToTransform.category, priority: transformPriority, date: dateVal, completed: false
        };

        const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        tasks.push(newTask);
        localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));

        let ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
        ideas = ideas.filter(i => i.id !== ideaToTransform.id);
        localStorage.setItem('focus_flow_ideas', JSON.stringify(ideas));

        closeTransformModal(); renderIdeasList(); renderTasksList(); updateDashboard(); renderCalendar();
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
        detTheme.textContent = task.theme; detTheme.style.backgroundColor = themeObj.color + '22'; detTheme.style.color = themeObj.color;
        const detPriority = document.getElementById('view-details-priority');
        detPriority.textContent = task.priority; detPriority.style.backgroundColor = pColor + '22'; detPriority.style.color = pColor;
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
            themeNameInput.value = ""; modalTheme.classList.remove('active');
            renderThemesIdeas(); renderFiltersIdeas(); updateTaskThemesList();
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
    // 5. SEÇÃO DE IDEIAS
    // ==========================================
    const ideaInput = document.getElementById('idea-input');
    const searchIdeaInput = document.getElementById('search-idea-input');

    function renderThemesIdeas() {
        const container = document.getElementById('category-pills');
        if (!container) return;
        container.innerHTML = '';
        themes.forEach(theme => {
            const pill = document.createElement('span');
            pill.className = `pill ${theme.name === selectedCategoryIdea ? 'active' : ''}`;
            pill.style.setProperty('--theme-color-bg', theme.color);
            if (theme.name === selectedCategoryIdea) {
                pill.style.backgroundColor = theme.color; pill.style.color = "#ffffff";
            }
            pill.innerHTML = `${theme.name} <span class="delete-theme">&times;</span>`;
            pill.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-theme')) return;
                selectedCategoryIdea = theme.name; renderThemesIdeas();
            });
            pill.querySelector('.delete-theme').addEventListener('click', (e) => {
                e.stopPropagation(); window.openConfirmModal(`Apagar o tema "${theme.name}"?`, theme.name);
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
            pill.textContent = theme.name; pill.style.setProperty('--theme-color-bg', theme.color);
            if (theme.name === currentFilterIdea) {
                pill.style.backgroundColor = theme.color; pill.style.color = "#ffffff";
            }
            pill.addEventListener('click', () => {
                currentFilterIdea = theme.name; renderFiltersIdeas(); renderIdeasList();
            });
            container.appendChild(pill);
        });
    }

    function renderIdeasList() {
        const container = document.getElementById('ideas-list');
        if (!container) return;
        container.innerHTML = '';
        const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
        const searchTerm = searchIdeaInput ? searchIdeaInput.value.toLowerCase() : "";
        const filtered = ideas.filter(idea => {
            const matchesCategory = currentFilterIdea === "Todos" || idea.category === currentFilterIdea;
            const matchesSearch = idea.content.toLowerCase().includes(searchTerm);
            const matchesFavorite = !filterFavoritesOnly || idea.favorite === true;
            return matchesCategory && matchesSearch && matchesFavorite;
        });
        
        filtered.slice().reverse().forEach(idea => {
            const themeData = themes.find(t => t.name === idea.category) || {color: "#94a3b8"};
            const div = document.createElement('div');
            div.className = `idea-card ${idea.favorite ? 'favorite' : ''}`;
            div.innerHTML = `
                <div class="idea-header">
                    <span class="idea-category-pill" style="background-color: ${themeData.color}22; color: ${themeData.color};">
                        ${idea.category}
                    </span>
                    <div class="idea-actions-container">
                        <span class="idea-date">${idea.date}</span>
                        <div class="dropdown">
                            <button class="btn-dropdown-toggle" onclick="window.toggleIdeaDropdown(event, ${idea.id})">▼</button>
                            <div id="dropdown-${idea.id}" class="dropdown-menu">
                                <button class="dropdown-item" onclick="window.transformIdeaToTask(${idea.id})">✅ Converter</button>
                                <button class="dropdown-item" onclick="window.toggleFavoriteIdea(${idea.id})">${idea.favorite ? '★' : '☆'} Favoritar</button>
                                <button class="dropdown-item btn-delete-option" onclick="window.openConfirmModal('Apagar este pensamento?', null, ${idea.id})">🗑️ Apagar</button>
                            </div>
                        </div>
                    </div>
                </div>
                <p class="idea-content">${formatTextWithLinks(idea.content)}</p>
            `;
            container.appendChild(div);
        });
    }

    const captureIdea = () => {
        if (ideaInput.value.trim()) {
            const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
            ideas.push({ id: Date.now(), content: ideaInput.value.trim(), category: selectedCategoryIdea, date: new Date().toLocaleDateString('pt-BR'), favorite: false });
            localStorage.setItem('focus_flow_ideas', JSON.stringify(ideas));
            ideaInput.value = ""; renderIdeasList();
        }
    };

    const btnFavFilter = document.getElementById('btn-filter-favorites');
    btnFavFilter?.addEventListener('click', () => {
        filterFavoritesOnly = !filterFavoritesOnly;
        btnFavFilter.classList.toggle('active', filterFavoritesOnly);
        renderIdeasList();
    });

    document.getElementById('btn-capture')?.addEventListener('click', captureIdea);
    ideaInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); captureIdea(); } });
    searchIdeaInput?.addEventListener('input', renderIdeasList);

    // ==========================================
    // 6. SEÇÃO DE TAREFAS
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

    const applyDateMask = (e) => {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 2) v = v.substring(0, 2) + "/" + v.substring(2, 4);
        e.target.value = v;
    };

    taskDateInput?.addEventListener('input', applyDateMask);
    document.getElementById('transform-date')?.addEventListener('input', applyDateMask);

    const addTask = () => {
        const title = taskInput?.value.trim();
        if (!title) { alert("Por favor, digite o nome da tarefa."); return; }
        const newTask = {
            id: Date.now(), title: title, description: taskDescInput ? taskDescInput.value.trim() : "Nenhuma observação.",
            theme: taskThemeSelect ? taskThemeSelect.value : "Geral", priority: selectedPriority,
            date: taskDateInput.value.trim() || "Hoje", completed: false
        };
        const tasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        tasks.push(newTask);
        localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
        taskInput.value = ""; if (taskDateInput) taskDateInput.value = ""; if (taskDescInput) taskDescInput.value = "";
        renderTasksList(); updateDashboard(); renderCalendar();
    };

    document.getElementById('btn-add-task')?.addEventListener('click', addTask);

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
                        <div class="task-meta"><span style="color: ${pColor}">● ${task.priority}</span><span>📅 ${task.date}</span></div>
                    </div>
                </div>
                <div class="task-right"><button class="btn-details-task">👁</button><button class="btn-delete-task">🗑</button></div>
            `;
            div.querySelector('.task-checkbox').addEventListener('change', () => window.alternarTarefa(task.id));
            div.querySelector('.btn-details-task').addEventListener('click', () => openDetailsModal(task));
            div.querySelector('.btn-delete-task').addEventListener('click', () => window.openConfirmModal(`Excluir a tarefa "${task.title}"?`, null, null, task.id));
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
    // 7. PAINEL (HOME)
    // ==========================================
    function updateDashboard() {
        const allTasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const hojeStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const dashboardDate = document.getElementById('dashboard-date');
        if (dashboardDate) dashboardDate.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        const tasksHoje = allTasks.filter(t => t.date === hojeStr || t.date === "Hoje");
        const pendentes = tasksHoje.filter(t => !t.completed);
        const concluidas = tasksHoje.filter(t => t.completed);
        
        if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pendentes.length;
        if (document.getElementById('stat-completed')) document.getElementById('stat-completed').textContent = concluidas.length;
        
        const total = tasksHoje.length;
        const porcentagem = total === 0 ? 0 : Math.round((concluidas.length / total) * 100);
        if (document.getElementById('progress-percentage')) document.getElementById('progress-percentage').textContent = porcentagem + '%';
        if (document.querySelector('.progress-fill')) document.querySelector('.progress-fill').style.width = porcentagem + '%';

        renderHomeTasks(tasksHoje);
    }

    function renderHomeTasks(tasks) {
        const container = document.getElementById('today-tasks-list');
        if (!container) return;
        container.innerHTML = tasks.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-muted);">Nada para hoje! ✨</p>' : '';
        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = `home-task-item ${task.completed ? 'completed' : ''}`;
            const pColor = task.priority === "Alta" ? "var(--accent-red)" : (task.priority === "Média" ? "#f59e0b" : "var(--accent-blue)");
            div.style.borderLeft = `4px solid ${pColor}`;
            div.innerHTML = `
                <div class="home-task-info">
                    <input type="checkbox" onchange="window.alternarTarefa(${task.id})" ${task.completed ? 'checked' : ''}>
                    <div class="home-task-meta"><span class="home-task-theme-tag">${task.theme}</span><span class="home-task-title">${task.title}</span></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ==========================================
    // 8. CALENDÁRIO (VISÃO SEMANA/MÊS)
    // ==========================================
    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const monthDisplay = document.getElementById('month-display');
        const toggleText = document.getElementById('toggle-text');
        
        if (!grid || !monthDisplay) return;

        grid.innerHTML = '';
        const allTasks = JSON.parse(localStorage.getItem('focus_flow_tasks')) || [];
        const hoje = new Date();
        const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(dateContext);
        monthDisplay.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${dateContext.getFullYear()}`;

        if (isMonthView) {
            // LÓGICA DE MÊS
            const year = dateContext.getFullYear();
            const month = dateContext.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const lastDate = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDay; i++) {
                grid.appendChild(document.createElement('div')).className = 'day-card other-month';
            }
            for (let day = 1; day <= lastDate; day++) {
                createDayCard(day, month, year, allTasks, grid, hoje);
            }
            if (toggleText) toggleText.textContent = 'Ver Semana';
        } else {
            // LÓGICA DE SEMANA
            const startOfWeek = new Date(dateContext);
            startOfWeek.setDate(dateContext.getDate() - dateContext.getDay()); // Volta para o domingo
            
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                createDayCard(currentDay.getDate(), currentDay.getMonth(), currentDay.getFullYear(), allTasks, grid, hoje);
            }
            if (toggleText) toggleText.textContent = 'Ver Mês';
        }
    }

    function createDayCard(day, month, year, allTasks, container, hoje) {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        // Verifica se é hoje
        if (day === hoje.getDate() && month === hoje.getMonth() && year === hoje.getFullYear()) {
            dayCard.classList.add('today');
        }

        dayCard.innerHTML = `<span class="day-number">${day}</span>`;
        const dataFormatada = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
        
        const tarefasDoDia = allTasks.filter(t => t.date === dataFormatada);
        if (tarefasDoDia.length > 0) {
            const indicators = document.createElement('div');
            indicators.className = 'cal-task-indicators';
            tarefasDoDia.forEach(task => {
                const dot = document.createElement('div');
                dot.className = 'task-dot';
                dot.style.backgroundColor = task.priority === "Alta" ? "#ef4444" : (task.priority === "Média" ? "#f59e0b" : "#3b82f6");
                indicators.appendChild(dot);
            });
            dayCard.appendChild(indicators);
        }
        container.appendChild(dayCard);
    }

    const setupCalendarEvents = () => {
        // Botão Hoje
        document.getElementById('btn-today-cal')?.addEventListener('click', () => {
            dateContext = new Date();
            renderCalendar();
        });

        // Botão Alternar Visão (Semana/Mês)
        document.getElementById('btn-toggle-view')?.addEventListener('click', () => {
            isMonthView = !isMonthView;
            renderCalendar();
        });

        // Setas de Navegação
        document.getElementById('prev-month')?.addEventListener('click', () => {
            if (isMonthView) {
                dateContext.setMonth(dateContext.getMonth() - 1);
            } else {
                dateContext.setDate(dateContext.getDate() - 7);
            }
            renderCalendar();
        });

        document.getElementById('next-month')?.addEventListener('click', () => {
            if (isMonthView) {
                dateContext.setMonth(dateContext.getMonth() + 1);
            } else {
                dateContext.setDate(dateContext.getDate() + 7);
            }
            renderCalendar();
        });
    };

    // ==========================================
    // 9. FUNÇÕES GLOBAIS (WINDOW)
    // ==========================================
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

    window.toggleIdeaDropdown = (event, ideaId) => {
        event.stopPropagation();
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => { if (menu.id !== `dropdown-${ideaId}`) menu.classList.remove('show'); });
        document.getElementById(`dropdown-${ideaId}`)?.classList.toggle('show');
    };

    window.toggleFavoriteIdea = (ideaId) => {
        const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
        const updated = ideas.map(i => { if (i.id === ideaId) i.favorite = !i.favorite; return i; });
        localStorage.setItem('focus_flow_ideas', JSON.stringify(updated));
        renderIdeasList();
    };

    window.transformIdeaToTask = (ideaId) => {
        const ideas = JSON.parse(localStorage.getItem('focus_flow_ideas')) || [];
        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
            ideaToTransform = idea;
            document.getElementById('transform-desc').value = idea.content;
            document.getElementById('transform-date').value = "";
            modalTransform?.classList.add('active');
        }
    };

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => menu.classList.remove('show'));
    });

    // INICIALIZAÇÃO FINAL
    renderThemesIdeas(); renderFiltersIdeas(); renderIdeasList();
    updateDashboard(); updateTaskThemesList(); renderTasksList(); renderCalendar(); setupCalendarEvents();
});