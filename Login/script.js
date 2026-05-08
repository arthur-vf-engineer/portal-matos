document.addEventListener('DOMContentLoaded', function() {
    
    // =======================================================
    // 1. AUTO-LIMPEZA E INICIALIZAÇÃO DO BANCO DE DADOS
    // =======================================================
    let users = JSON.parse(localStorage.getItem('matos_users')) || [];
    
    // Se existir usuários antigos sem senha, limpa tudo para evitar bugs
    if (users.length > 0 && !users[0].password) {
        localStorage.clear();
        users = [];
    }

    // Se o banco estiver vazio, cria os dados padrão com senha "123"
    if (users.length === 0) {
        const defaultUsers = [
            { id: 1, name: 'Admin Matos', email: 'admin@grupomatos.com.br', password: '123', role: 'admin' },
            { id: 2, name: 'Comercial Matos', email: 'comercial@grupomatos.com.br', password: '123', role: 'user' }
        ];
        localStorage.setItem('matos_users', JSON.stringify(defaultUsers));
        
        localStorage.setItem('matos_carousel', JSON.stringify([
            { image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&h=400&fit=crop", title: "Nova Linha", subtitle: "Confira a nova campanha.", badge: "Lançamento" }
        ]));
        localStorage.setItem('matos_feed', JSON.stringify([
            { title: "Bem-vindo ao Portal", category: "TI & Sistemas", content: "O novo sistema está online.", date: "Hoje" }
        ]));
        localStorage.setItem('matos_notifications', JSON.stringify([
            { title: "Sistema Atualizado", text: "O portal Grupo Matos salva seus dados.", theme: "success" }
        ]));
        localStorage.setItem('matos_chat', JSON.stringify([
            { id: 1, name: "Geral (Todos)", messages: [] }
        ]));
    }


    // =======================================================
    // 2. MOSTRAR/OCULTAR SENHA
    // =======================================================
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }

    // =======================================================
    // 3. LOGIN COM SESSÃO ISOLADA POR ABA
    // =======================================================
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            loginAlert.classList.add('d-none');
            const originalBtnText = btnLogin.innerHTML;
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Validando...';
            btnLogin.disabled = true;

            setTimeout(() => {
                const dbUsers = JSON.parse(localStorage.getItem('matos_users'));
                const foundUser = dbUsers.find(u => u.email === email && u.password === password);

                if (foundUser) {
                    // A MÁGICA: Salva no sessionStorage (Único para esta aba!)
                    sessionStorage.setItem('matos_currentUser', JSON.stringify(foundUser));
                    
                    btnLogin.innerHTML = '<i class="bi bi-check-circle"></i> CONECTADO';
                    btnLogin.classList.replace('btn-matos', 'btn-success');
                    
                    setTimeout(() => {
                        window.location.href = './Home/dashboard.html';
                    }, 500);
                } else {
                    loginAlert.classList.remove('d-none');
                    btnLogin.innerHTML = originalBtnText;
                    btnLogin.disabled = false;
                    document.getElementById('password').value = '';
                }
            }, 800);
        });
    }
});
