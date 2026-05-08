document.addEventListener('DOMContentLoaded', function() {

    // =======================================================
    // 1. SISTEMA DE AUTENTICAÇÃO E INICIALIZAÇÃO
    // =======================================================
    let users = JSON.parse(localStorage.getItem('matos_users')) || [];
    if (users.length > 0 && !users[0].password) { localStorage.clear(); users = []; }

    if (users.length === 0) {
        const defaultUsers = [
            { id: 1, name: 'Admin Matos', email: 'admin@grupomatos.com.br', password: '123', role: 'admin', department: 'TI', canEditNews: true, canEditChat: true },
            { id: 2, name: 'Comercial Matos', email: 'comercial@grupomatos.com.br', password: '123', role: 'user', department: 'Comercial', canEditNews: false, canEditChat: false }
        ];
        localStorage.setItem('matos_users', JSON.stringify(defaultUsers));
        
        localStorage.setItem('matos_carousel', JSON.stringify([{ image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&h=400&fit=crop", title: "Nova Linha", subtitle: "Confira a nova campanha.", badge: "Lançamento" }]));
        localStorage.setItem('matos_feed', JSON.stringify([{ title: "Bem-vindo ao Portal", category: "TI & Sistemas", content: "O novo sistema está online.", date: "Hoje" }]));
        localStorage.setItem('matos_notifications', JSON.stringify([{ title: "Sistema Atualizado", text: "O portal Grupo Matos salva seus dados.", theme: "success" }]));
        localStorage.setItem('matos_chat', JSON.stringify([{ id: 1, name: "Geral (Todos)", icon: "bi-hash", members: [1, 2], messages: [] }]));
    }

    let currentUser = JSON.parse(sessionStorage.getItem('matos_currentUser'));
    if (!currentUser) { window.location.href = 'index.html'; return; }

    window.switchUser = function(role) {
        const users = JSON.parse(localStorage.getItem('matos_users'));
        const targetUser = users.find(u => u.role === role);
        if(targetUser) { sessionStorage.setItem('matos_currentUser', JSON.stringify(targetUser)); location.reload(); }
    };

    function applyPermissions() {
        document.getElementById('userNameDisplay').textContent = currentUser.name;
        document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=fff&color=d63768`;
        
        // Lógica de Permissões
        const isMasterAdmin = currentUser.role === 'admin';
        const canEditNews = isMasterAdmin || currentUser.canEditNews;
        const canEditChat = isMasterAdmin || currentUser.canEditChat;

        document.querySelectorAll('.admin-only').forEach(el => el.classList.toggle('d-none', !isMasterAdmin));
        document.querySelectorAll('.news-admin-only').forEach(el => el.classList.toggle('d-none', !canEditNews));
        document.querySelectorAll('.chat-admin-only').forEach(el => el.classList.toggle('d-none', !canEditChat));
    }
    applyPermissions();

    // =======================================================
    // 2. SISTEMA DE AVISOS (SINO E TOAST MINIMALISTA)
    // =======================================================
    const bellListKey = `matos_bell_notifs_${currentUser.id}`;
    
    function getBellNotifs() { return JSON.parse(localStorage.getItem(bellListKey)) || []; }
    function setBellNotifs(data) { localStorage.setItem(bellListKey, JSON.stringify(data)); }

    window.renderBellNotifications = function() {
        const notifs = getBellNotifs();
        const list = document.getElementById('bellNotificationsList');
        const badge = document.getElementById('bellBadge');
        
        list.innerHTML = '';
        
        if (notifs.length === 0) {
            badge.classList.add('d-none');
            list.innerHTML = '<div class="text-center p-4 text-muted small">Nenhuma notificação.</div>';
            return;
        }

        badge.classList.remove('d-none');

        notifs.forEach(notif => {
            list.innerHTML += `
                <div class="p-3 border-bottom bell-notif-item unread d-flex gap-3 align-items-start">
                    <div class="mt-1"><i class="bi bi-chat-dots-fill text-matos fs-5"></i></div>
                    <div>
                        <strong class="d-block small text-dark">${notif.title}</strong>
                        <span class="d-block small text-muted">${notif.body}</span>
                        <small class="text-muted" style="font-size: 0.7rem;">${notif.time}</small>
                    </div>
                </div>
            `;
        });
    };

    window.clearBellNotifications = function() {
        setBellNotifs([]);
        renderBellNotifications();
    };

    window.showToastNotification = function(title, body) {
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastMessageBody').textContent = body;
        const toastElement = document.getElementById('liveToast');
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        if (window.AudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        }
    };

    window.addSystemNotification = function(title, body) {
        let notifs = getBellNotifs();
        notifs.unshift({ title, body, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
        if(notifs.length > 20) notifs.pop();
        setBellNotifs(notifs);
        renderBellNotifications();
        showToastNotification(title, body);
    };

    renderBellNotifications();

    document.getElementById('bellDropdownToggle').addEventListener('click', () => {
        document.getElementById('bellBadge').classList.add('d-none');
    });

    // =======================================================
    // 3. NAVEGAÇÃO ENTRE ABAS
    // =======================================================
    const tabLinks = document.querySelectorAll('.tab-link');
    const viewSections = document.querySelectorAll('.view-section');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            tabLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('data-target');
            viewSections.forEach(section => {
                section.classList.add('d-none');
                section.classList.remove('active');
            });
            document.getElementById(targetId).classList.remove('d-none');
            document.getElementById(targetId).classList.add('active', 'animate-fade-in');

            if(targetId === 'view-chat') renderChatGroups();
            if(targetId === 'view-users') renderUsersTable();
        });
    });

    // =======================================================
    // 4. DASHBOARD CRUD
    // =======================================================
    function getLS(key) { return JSON.parse(localStorage.getItem(key)) || []; }
    function setLS(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

    function renderCarousel() {
        const items = getLS('matos_carousel');
        const inner = document.getElementById('carouselInner');
        const indicators = document.getElementById('carouselIndicators');
        inner.innerHTML = ''; indicators.innerHTML = '';
        items.forEach((item, i) => {
            const act = i === 0 ? 'active' : '';
            indicators.innerHTML += `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}" class="${act}"></button>`;
            inner.innerHTML += `
                <div class="carousel-item ${act}">
                    ${(currentUser.role === 'admin' || currentUser.canEditNews) ? `<button class="delete-banner-btn" onclick="deleteCarousel(${i})"><i class="bi bi-x-lg"></i></button>` : ''}
                    <img src="${item.image}" class="d-block w-100 hero-img">
                    <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 rounded-3 p-3 mb-4 mx-auto w-75 backdrop-blur">
                        <span class="badge bg-matos mb-2">${item.badge}</span><h3 class="fw-bold">${item.title}</h3><p>${item.subtitle}</p>
                    </div>
                </div>`;
        });
    }

    function renderFeed() {
        const items = getLS('matos_feed');
        const feed = document.getElementById('newsFeed');
        feed.innerHTML = '';
        items.forEach((item, i) => {
            feed.innerHTML += `
                <div class="card card-hover border-0 shadow-sm mb-4 news-card">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="badge bg-light text-matos border border-matos-subtle">${item.category}</span>
                            ${(currentUser.role === 'admin' || currentUser.canEditNews) ? `<button class="btn btn-sm text-danger border-0" onclick="deleteFeed(${i})"><i class="bi bi-trash3-fill"></i></button>` : ''}
                        </div>
                        <h5 class="card-title fw-bold">${item.title}</h5>
                        <p class="card-text text-muted">${item.content}</p>
                        <p class="card-text"><small class="text-muted"><i class="bi bi-clock me-1"></i>${item.date}</small></p>
                    </div>
                </div>`;
        });
    }

    window.renderNotifications = function() {
        const items = getLS('matos_notifications');
        const list = document.getElementById('notificationsList');
        const icons = { primary: "bi-calendar-event", success: "bi-check-circle", danger: "bi-exclamation-triangle", warning: "bi-bell" };
        list.innerHTML = '';
        items.forEach((item, i) => {
            list.innerHTML += `
                <li class="list-group-item p-3 border-bottom d-flex align-items-start position-relative">
                    ${(currentUser.role === 'admin' || currentUser.canEditNews) ? `
                    <div class="notification-actions news-admin-only">
                        <button class="btn btn-sm text-primary" onclick="openNotificationModal(${i})"><i class="bi bi-pencil-square"></i></button>
                        <button class="btn btn-sm text-danger" onclick="deleteNotif(${i})"><i class="bi bi-trash"></i></button>
                    </div>` : ''}
                    <div class="bg-${item.theme} bg-opacity-10 text-${item.theme} rounded-circle p-2 me-3 d-flex justify-content-center align-items-center" style="width: 40px; height: 40px;">
                        <i class="bi ${icons[item.theme] || 'bi-info-circle'}"></i>
                    </div>
                    <div class="pe-5 w-100"><h6 class="mb-1 fw-bold small">${item.title}</h6><p class="mb-0 text-muted" style="font-size: 0.8rem;">${item.text}</p></div>
                </li>`;
        });
    }

    window.deleteCarousel = function(i) { let d = getLS('matos_carousel'); d.splice(i,1); setLS('matos_carousel', d); renderCarousel(); }
    window.deleteFeed = function(i) { let d = getLS('matos_feed'); d.splice(i,1); setLS('matos_feed', d); renderFeed(); }
    window.deleteNotif = function(i) { let d = getLS('matos_notifications'); d.splice(i,1); setLS('matos_notifications', d); renderNotifications(); }

    window.openNotificationModal = function(index = -1) {
        const titleEl = document.getElementById('notificationModalTitle');
        const indexInput = document.getElementById('notificationIndex');
        const form = document.getElementById('formNotification');
        if (index === -1) {
            titleEl.innerHTML = '<i class="bi bi-lightning-charge me-2 text-warning"></i>Nova Notificação';
            form.reset();
            indexInput.value = -1;
        } else {
            titleEl.innerHTML = '<i class="bi bi-pencil-square me-2 text-warning"></i>Editar Notificação';
            const items = getLS('matos_notifications');
            const notif = items[index];
            document.getElementById('notifTitle').value = notif.title;
            document.getElementById('notifText').value = notif.text;
            document.getElementById('notifTheme').value = notif.theme;
            indexInput.value = index;
        }
        bootstrap.Modal.getOrCreateInstance(document.getElementById('notificationModal')).show();
    };

    document.getElementById('formNewCarousel').addEventListener('submit', (e) => {
        e.preventDefault();
        let d = getLS('matos_carousel');
        d.unshift({ image: document.getElementById('bannerUrl').value, title: document.getElementById('bannerTitle').value, subtitle: document.getElementById('bannerSubtitle').value, badge: document.getElementById('bannerBadge').value });
        setLS('matos_carousel', d); renderCarousel(); bootstrap.Modal.getOrCreateInstance(document.getElementById('newCarouselModal')).hide(); e.target.reset();
    });

    document.getElementById('formNewPost').addEventListener('submit', (e) => {
        e.preventDefault();
        let d = getLS('matos_feed');
        d.unshift({ title: document.getElementById('postTitle').value, category: document.getElementById('postCategory').value, content: document.getElementById('postContent').value, date: new Date().toLocaleDateString('pt-BR') });
        setLS('matos_feed', d); renderFeed(); bootstrap.Modal.getOrCreateInstance(document.getElementById('newPostModal')).hide(); e.target.reset();
    });

    document.getElementById('formNotification').addEventListener('submit', (e) => {
        e.preventDefault();
        let items = getLS('matos_notifications');
        const index = parseInt(document.getElementById('notificationIndex').value);
        const notifData = { title: document.getElementById('notifTitle').value, text: document.getElementById('notifText').value, theme: document.getElementById('notifTheme').value };
        if (index === -1) { items.unshift(notifData); } else { items[index] = notifData; }
        setLS('matos_notifications', items); renderNotifications(); bootstrap.Modal.getOrCreateInstance(document.getElementById('notificationModal')).hide();
    });

    renderCarousel(); renderFeed(); renderNotifications();

    // =======================================================
    // 5. CHAT INTERNO E SINCRONIZAÇÃO EM TEMPO REAL
    // =======================================================
    let currentActiveGroupId = null;
    let pendingImageBase64 = null;

    window.renderChatGroups = function() {
        const groups = getLS('matos_chat');
        const list = document.getElementById('chatGroupsList');
        list.innerHTML = '';
        
        const myGroups = groups.filter(g => !g.members || g.members.includes(currentUser.id));

        myGroups.forEach(g => {
            const isActive = g.id === currentActiveGroupId ? 'active' : '';
            let displayName = g.name;

            if (g.isDirect) {
                const otherUserId = g.members.find(id => id !== currentUser.id);
                const otherUser = getLS('matos_users').find(u => u.id === otherUserId);
                if (otherUser) displayName = otherUser.name;
            }

            list.innerHTML += `
                <div class="list-group-item chat-group-item ${isActive}" onclick="loadChat(${g.id})">
                    <i class="bi ${g.icon || 'bi-hash'} text-muted me-2"></i>${displayName}
                </div>`;
        });
        
        if(!currentActiveGroupId && myGroups.length > 0) {
            loadChat(myGroups[0].id);
        } else if (myGroups.length === 0) {
            document.getElementById('chatMessages').innerHTML = '<div class="text-center text-muted mt-5">Você não faz parte de nenhum canal.</div>';
            document.getElementById('currentChatTitle').innerText = "Sem Grupos";
            document.getElementById('chatInputMessage').disabled = true;
            document.getElementById('btnSendMessage').disabled = true;
            document.getElementById('btnAttachImage').disabled = true;
        }
    }

    function renderMessagesOnly(group) {
        const chatContainer = document.getElementById('chatMessages');
        chatContainer.innerHTML = '';
        if (group.messages.length === 0) {
            chatContainer.innerHTML = '<div class="text-center text-muted mt-5">Nenhuma mensagem ainda. Inicie a conversa!</div>';
            return;
        }
        group.messages.forEach(msg => {
            const isMe = msg.sender === currentUser.name;
            const alignClass = isMe ? 'msg-sent' : 'msg-received';
            const imgHtml = msg.image ? `<img src="${msg.image}" class="chat-img-attachment w-100 rounded-3 mb-2" style="max-width: 250px;">` : '';
            const textHtml = msg.text ? `<div>${msg.text}</div>` : '';

            chatContainer.innerHTML += `
                <div class="d-flex flex-column mb-3">
                    <div class="msg-bubble ${alignClass}">
                        ${!isMe && !group.isDirect ? `<div class="msg-sender">${msg.sender}</div>` : ''}
                        ${imgHtml}
                        ${textHtml}
                        <div class="msg-time">${msg.time}</div>
                    </div>
                </div>`;
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    window.loadChat = function(groupId) {
        currentActiveGroupId = groupId;
        const groups = getLS('matos_chat');
        const group = groups.find(g => g.id === groupId);
        if(!group) return;

        let displayName = group.name;
        if (group.isDirect) {
            const otherUserId = group.members.find(id => id !== currentUser.id);
            const otherUser = getLS('matos_users').find(u => u.id === otherUserId);
            if (otherUser) displayName = `Conversa com ${otherUser.name}`;
        }

        document.getElementById('currentChatTitle').innerText = displayName;
        document.getElementById('chatInputMessage').disabled = false;
        document.getElementById('btnSendMessage').disabled = false;
        document.getElementById('btnAttachImage').disabled = false;
        
        const btnDeleteGroup = document.getElementById('btnDeleteCurrentGroup');
        const btnEditGroup = document.getElementById('btnEditCurrentGroup');
        
        if ((currentUser.role === 'admin' || currentUser.canEditChat) && groupId !== 1 && !group.isDirect) {
            btnDeleteGroup.classList.remove('d-none');
            btnEditGroup.classList.remove('d-none');
            btnDeleteGroup.onclick = () => deleteChatGroup(groupId);
            btnEditGroup.onclick = () => openEditGroupModal(groupId);
        } else {
            btnDeleteGroup.classList.add('d-none');
            btnEditGroup.classList.add('d-none');
        }

        renderChatGroups();
        renderMessagesOnly(group);
        resetImageUI();
    };

    const btnAttachImage = document.getElementById('btnAttachImage');
    const chatImageInput = document.getElementById('chatImageInput');
    const chatInputMessage = document.getElementById('chatInputMessage');

    btnAttachImage.addEventListener('click', () => { chatImageInput.click(); });

    chatImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1024 * 1024) { alert('Atenção: Envie imagens com menos de 1MB.'); this.value = ''; return; }
        const reader = new FileReader();
        reader.onload = function(event) {
            pendingImageBase64 = event.target.result;
            chatInputMessage.placeholder = "Imagem anexada. Digite uma legenda...";
            btnAttachImage.classList.replace('btn-light', 'btn-success');
            btnAttachImage.classList.replace('text-muted', 'text-white');
        };
        reader.readAsDataURL(file);
    });

    function resetImageUI() {
        pendingImageBase64 = null;
        chatImageInput.value = '';
        chatInputMessage.placeholder = "Digite sua mensagem...";
        btnAttachImage.classList.replace('btn-success', 'btn-light');
        btnAttachImage.classList.replace('text-white', 'text-muted');
    }

    document.getElementById('formSendMessage').addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInputMessage.value.trim();
        if(text === '' && !pendingImageBase64) return;
        if(!currentActiveGroupId) return;

        let groups = getLS('matos_chat');
        let groupIndex = groups.findIndex(g => g.id === currentActiveGroupId);
        
        groups[groupIndex].messages.push({ sender: currentUser.name, text: text, image: pendingImageBase64, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
        
        try { setLS('matos_chat', groups); } catch (error) {
            alert("Erro: O armazenamento local está cheio. Tente enviar uma imagem menor.");
            resetImageUI(); return;
        }
        
        chatInputMessage.value = '';
        resetImageUI();
        renderMessagesOnly(groups[groupIndex]);
    });

    // --- CRIAÇÃO DE GRUPOS ---
    window.openNewGroupModal = function() {
        const users = getLS('matos_users');
        const listContainer = document.getElementById('groupUsersList');
        listContainer.innerHTML = '';
        users.forEach(u => {
            const isMe = u.id === currentUser.id;
            listContainer.innerHTML += `
                <div class="form-check border-bottom py-2">
                    <input class="form-check-input group-member-checkbox" type="checkbox" value="${u.id}" id="userCheck${u.id}" ${isMe ? 'checked disabled' : ''}>
                    <label class="form-check-label w-100" for="userCheck${u.id}">
                        ${u.name} <span class="badge bg-light text-secondary ms-2">${u.role === 'admin' ? 'Admin' : 'Usuário'}</span>
                    </label>
                </div>
            `;
        });
        bootstrap.Modal.getOrCreateInstance(document.getElementById('newGroupModal')).show();
    };

    document.getElementById('formNewGroup').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('groupName').value.trim();
        const iconSelect = document.getElementById('groupIcon');
        const icon = iconSelect ? iconSelect.value : 'bi-hash';

        if(name !== '') {
            const checkboxes = document.querySelectorAll('.group-member-checkbox');
            const selectedMembers = [];
            checkboxes.forEach(chk => { if (chk.checked || chk.disabled) selectedMembers.push(parseInt(chk.value)); });

            let groups = getLS('matos_chat');
            const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;
            groups.push({ id: newId, name: name, icon: icon, isDirect: false, members: selectedMembers, messages: [] });
            setLS('matos_chat', groups);
            
            bootstrap.Modal.getOrCreateInstance(document.getElementById('newGroupModal')).hide();
            e.target.reset();
            loadChat(newId);
        }
    });

    // --- EDIÇÃO DE GRUPOS ---
    window.openEditGroupModal = function(groupId) {
        const groups = getLS('matos_chat');
        const group = groups.find(g => g.id === groupId);
        if(!group) return;

        document.getElementById('editGroupId').value = group.id;
        document.getElementById('editGroupName').value = group.name;
        document.getElementById('editGroupIcon').value = group.icon || 'bi-hash';

        const users = getLS('matos_users');
        const listContainer = document.getElementById('editGroupUsersList');
        listContainer.innerHTML = '';
        users.forEach(u => {
            const isMe = u.id === currentUser.id;
            const isChecked = group.members.includes(u.id) ? 'checked' : '';
            listContainer.innerHTML += `
                <div class="form-check border-bottom py-2">
                    <input class="form-check-input edit-group-member-checkbox" type="checkbox" value="${u.id}" id="editUserCheck${u.id}" ${isChecked} ${isMe ? 'disabled' : ''}>
                    <label class="form-check-label w-100" for="editUserCheck${u.id}">
                        ${u.name} <span class="badge bg-light text-secondary ms-2">${u.role === 'admin' ? 'Admin' : 'Usuário'}</span>
                    </label>
                </div>
            `;
        });

        bootstrap.Modal.getOrCreateInstance(document.getElementById('editGroupModal')).show();
    };

    document.getElementById('formEditGroup').addEventListener('submit', (e) => {
        e.preventDefault();
        const groupId = parseInt(document.getElementById('editGroupId').value);
        const name = document.getElementById('editGroupName').value.trim();
        const icon = document.getElementById('editGroupIcon').value;

        if(name !== '') {
            const checkboxes = document.querySelectorAll('.edit-group-member-checkbox');
            const selectedMembers = [];
            checkboxes.forEach(chk => { if (chk.checked || chk.disabled) selectedMembers.push(parseInt(chk.value)); });

            let groups = getLS('matos_chat');
            const index = groups.findIndex(g => g.id === groupId);
            if(index !== -1) {
                groups[index].name = name;
                groups[index].icon = icon;
                groups[index].members = selectedMembers;
                setLS('matos_chat', groups);
            }
            
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editGroupModal')).hide();
            renderChatGroups();
            loadChat(groupId);
        }
    });

    // --- MENSAGENS DIRETAS (1 a 1) ---
    window.openNewDirectModal = function() {
        const users = getLS('matos_users');
        const select = document.getElementById('directUserSelect');
        select.innerHTML = '<option value="">Escolha uma pessoa...</option>';
        users.forEach(u => {
            if (u.id !== currentUser.id) {
                select.innerHTML += `<option value="${u.id}">${u.name} (${u.email})</option>`;
            }
        });
        bootstrap.Modal.getOrCreateInstance(document.getElementById('newDirectModal')).show();
    };

    document.getElementById('formNewDirect').addEventListener('submit', (e) => {
        e.preventDefault();
        const targetUserId = parseInt(document.getElementById('directUserSelect').value);
        if(isNaN(targetUserId)) return;

        let groups = getLS('matos_chat');
        
        let existingDM = groups.find(g => g.isDirect && g.members.includes(currentUser.id) && g.members.includes(targetUserId));
        
        if (existingDM) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('newDirectModal')).hide();
            loadChat(existingDM.id);
            return;
        }

        const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;

        groups.push({ 
            id: newId, 
            name: "DM", 
            icon: 'bi-person', 
            isDirect: true, 
            members: [currentUser.id, targetUserId], 
            messages: [] 
        });
        
        setLS('matos_chat', groups);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('newDirectModal')).hide();
        e.target.reset();
        loadChat(newId);
    });

    // --- EXCLUSÃO DE GRUPOS ---
    window.deleteChatGroup = function(groupId) {
        if(confirm("Tem certeza que deseja excluir esta conversa?")) {
            let groups = getLS('matos_chat');
            groups = groups.filter(g => g.id !== groupId);
            setLS('matos_chat', groups);
            currentActiveGroupId = null;
            renderChatGroups();
            document.getElementById('chatMessages').innerHTML = '<div class="text-center text-muted mt-5">Conversa apagada. Selecione outro canal.</div>';
            document.getElementById('currentChatTitle').innerText = "Selecione um grupo";
            document.getElementById('btnDeleteCurrentGroup').classList.add('d-none');
            document.getElementById('btnEditCurrentGroup').classList.add('d-none');
            document.getElementById('chatInputMessage').disabled = true;
            document.getElementById('btnAttachImage').disabled = true;
        }
    }

    // --- SINCRONIZAÇÃO EM TEMPO REAL ---
    window.addEventListener('storage', function(e) {
        if (e.key === 'matos_chat') {
            const oldGroups = JSON.parse(e.oldValue || '[]');
            const newGroups = JSON.parse(e.newValue || '[]');

            newGroups.forEach(newGroup => {
                if (!newGroup.members || newGroup.members.includes(currentUser.id)) {
                    const oldGroup = oldGroups.find(g => g.id === newGroup.id);
                    const oldMsgCount = oldGroup ? oldGroup.messages.length : 0;
                    
                    if (newGroup.messages.length > oldMsgCount) {
                        const newMessages = newGroup.messages.slice(oldMsgCount);
                        
                        newMessages.forEach(msg => {
                            if (msg.sender !== currentUser.name) {
                                const resumoAviso = msg.text ? msg.text : 'Enviou uma imagem 📷';
                                const localNome = newGroup.isDirect ? msg.sender : `${msg.sender} (em ${newGroup.name})`;
                                addSystemNotification(localNome, resumoAviso);
                            }
                        });
                    }
                }
            });

            if (currentActiveGroupId) {
                const currentGroup = newGroups.find(g => g.id === currentActiveGroupId);
                if(currentGroup && currentGroup.members.includes(currentUser.id)) { 
                    renderMessagesOnly(currentGroup); 
                } else {
                    currentActiveGroupId = null;
                    document.getElementById('chatMessages').innerHTML = '<div class="text-center text-muted mt-5">Você foi removido deste grupo ou ele foi excluído.</div>';
                }
            }
            renderChatGroups();
        }

        if (e.key === 'matos_users' && document.getElementById('view-users').classList.contains('active')) {
            renderUsersTable();
        }
    });

    // =======================================================
    // 6. GESTÃO DE USUÁRIOS (CRIAR, EDITAR E EXCLUIR)
    // =======================================================
    window.renderUsersTable = function() {
        const users = getLS('matos_users');
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(u => {
            const roleBadge = u.role === 'admin' ? '<span class="badge bg-danger">Administrador</span>' : '<span class="badge bg-secondary">Usuário</span>';
            const deptBadge = u.department ? `<span class="badge bg-light text-dark border border-secondary-subtle">${u.department}</span>` : '<span class="text-muted small">-</span>';
            
            // Exibe ícones de permissões especiais se for usuário comum
            let perms = '';
            if (u.role !== 'admin') {
                if (u.canEditNews) perms += '<span class="badge bg-warning text-dark border border-warning-subtle ms-1" title="Pode editar Painel/Notícias"><i class="bi bi-newspaper"></i></span>';
                if (u.canEditChat) perms += '<span class="badge bg-info text-dark border border-info-subtle ms-1" title="Pode editar Chat/Grupos"><i class="bi bi-chat"></i></span>';
            }

            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=f1f5f9&color=713898" class="rounded-circle me-3" width="40">
                            <strong>${u.name}</strong>
                        </div>
                    </td>
                    <td class="text-muted">${u.email}</td>
                    <td>${deptBadge}</td>
                    <td>${roleBadge} ${perms}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditUserModal(${u.id})" title="Editar Usuário"><i class="bi bi-pencil"></i></button>
                        ${u.id !== currentUser.id ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})" title="Excluir Usuário"><i class="bi bi-trash"></i></button>` : '<span class="text-muted small ms-2">Você</span>'}
                    </td>
                </tr>`;
        });
    }

    document.getElementById('formNewUser').addEventListener('submit', (e) => {
        e.preventDefault();
        let users = getLS('matos_users');
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({
            id: newId,
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value,
            department: document.getElementById('userDepartment').value,
            canEditNews: document.getElementById('userCanEditNews').checked,
            canEditChat: document.getElementById('userCanEditChat').checked
        });
        
        setLS('matos_users', users);
        
        let groups = getLS('matos_chat');
        let geralGroup = groups.find(g => g.id === 1);
        if(geralGroup && !geralGroup.members.includes(newId)) {
            geralGroup.members.push(newId);
            setLS('matos_chat', groups);
        }

        renderUsersTable();
        bootstrap.Modal.getOrCreateInstance(document.getElementById('newUserModal')).hide();
        e.target.reset();
        alert("Usuário criado com sucesso!");
    });

    window.openEditUserModal = function(id) {
        const users = getLS('matos_users');
        const user = users.find(u => u.id === id);
        if(!user) return;

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserDepartment').value = user.department || '';
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserPassword').value = user.password;
        
        document.getElementById('editUserCanEditNews').checked = user.canEditNews || false;
        document.getElementById('editUserCanEditChat').checked = user.canEditChat || false;

        bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal')).show();
    };

    document.getElementById('formEditUser').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('editUserId').value);
        let users = getLS('matos_users');
        const index = users.findIndex(u => u.id === id);

        if(index !== -1) {
            users[index].name = document.getElementById('editUserName').value;
            users[index].email = document.getElementById('editUserEmail').value;
            users[index].department = document.getElementById('editUserDepartment').value;
            users[index].role = document.getElementById('editUserRole').value;
            users[index].password = document.getElementById('editUserPassword').value;
            users[index].canEditNews = document.getElementById('editUserCanEditNews').checked;
            users[index].canEditChat = document.getElementById('editUserCanEditChat').checked;

            setLS('matos_users', users);

            // Se o usuário logado editar a si mesmo, atualiza a sessão
            if(currentUser.id === id) {
                sessionStorage.setItem('matos_currentUser', JSON.stringify(users[index]));
                currentUser = users[index];
                applyPermissions(); 
            }

            renderUsersTable();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal')).hide();
        }
    });

    window.deleteUser = function(id) {
        if(confirm("Remover o acesso deste usuário permanentemente?")) {
            let users = getLS('matos_users');
            users = users.filter(u => u.id !== id);
            setLS('matos_users', users);
            renderUsersTable();
        }
    }
});