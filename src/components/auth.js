import { API } from '../api.js';

export function renderAuth(onLoginSuccess) {
  const container = document.createElement('div');
  container.className = 'auth-container';
  container.innerHTML = `
        <div class="dashboard-card" style="width: 100%; max-width: 400px; margin: 0;">
            <h1 id="auth-title">Connexion</h1>
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 24px;">
                <input type="text" id="partner-code" placeholder="Code Partenaire" 
                    style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit; display: none;">
                
                <div id="login-fields">
                    <input type="text" id="username" placeholder="Nom d'utilisateur" required 
                        style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit;">
                    <input type="password" id="password" placeholder="Mot de passe" required 
                        style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit;">
                    <input type="text" id="firstname" placeholder="Prénom (optionnel)" 
                        style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit; display: none;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <input type="checkbox" id="remember" style="width: auto;">
                        <label for="remember" style="font-size: 0.9rem; color: var(--color-text-muted);">Rester connecté</label>
                    </div>
                </div>

                <button type="submit" class="btn-log" style="width: 100%; margin-top: 8px;">Se connecter</button>
            </form>
            <p style="margin-top: 16px; font-size: 0.875rem; color: var(--color-text-muted);">
                <span id="auth-switch-text">Pas de compte ?</span>
                <a href="#" id="auth-switch-btn" style="color: var(--color-primary-dark); font-weight: 600;">S'inscrire</a>
            </p>
            <p id="partner-link-container" style="margin-top: 8px; font-size: 0.875rem; text-align: center;">
                 <a href="#" id="partner-mode-btn" style="color: #666; text-decoration: underline;">J'ai un code partenaire</a>
            </p>
            <div id="auth-error" style="color: #e57373; font-size: 0.875rem; margin-top: 12px; display: none;"></div>
        </div>
    `;

  let isLogin = true;
  let isPartner = false;

  const form = container.querySelector('#auth-form');
  const switchBtn = container.querySelector('#auth-switch-btn');
  const partnerBtn = container.querySelector('#partner-mode-btn');
  const title = container.querySelector('#auth-title');
  const errorMsg = container.querySelector('#auth-error');
  const loginFields = container.querySelector('#login-fields');
  const partnerCodeInput = container.querySelector('#partner-code');
  const partnerLinkContainer = container.querySelector('#partner-link-container');
  const authSwitchText = container.querySelector('#auth-switch-text');
  
  // Toggle Partner Mode
  partnerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isPartner = !isPartner;
      
      if (isPartner) {
          // Switch to Partner
          title.textContent = 'Accès Partenaire';
          loginFields.style.display = 'none';
          partnerCodeInput.style.display = 'block';
          form.querySelector('button').textContent = 'Accéder';
          partnerBtn.textContent = 'Retour à la connexion';
          
          // Hide Register Switch
          switchBtn.style.display = 'none';
          authSwitchText.style.display = 'none';
          
          // Remove required from login fields to avoid validation error
          form.querySelector('#username').required = false;
          form.querySelector('#password').required = false;
          partnerCodeInput.required = true;
          
      } else {
          // Switch back to Login
          title.textContent = isLogin ? 'Connexion' : 'Inscription';
          loginFields.style.display = 'block';
          partnerCodeInput.style.display = 'none';
          form.querySelector('button').textContent = isLogin ? 'Se connecter' : "S'inscrire";
          partnerBtn.textContent = 'J\'ai un code partenaire';
          
          switchBtn.style.display = 'inline';
          authSwitchText.style.display = 'inline';
          
          form.querySelector('#username').required = true;
          form.querySelector('#password').required = true;
          partnerCodeInput.required = false;
      }
      errorMsg.style.display = 'none';
  });

  switchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    title.textContent = isLogin ? 'Connexion' : 'Inscription';
    form.querySelector('button').textContent = isLogin ? 'Se connecter' : "S'inscrire";
    container.querySelector('#auth-switch-text').textContent = isLogin
      ? 'Pas de compte ?'
      : 'Déjà un compte ?';
    switchBtn.textContent = isLogin ? "S'inscrire" : 'Se connecter';
    errorMsg.style.display = 'none';
    form.querySelector('#firstname').style.display = isLogin ? 'none' : 'block';
  });
  
  
 
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    if (isPartner) {
        const code = partnerCodeInput.value.trim();
        if (!code) {
             errorMsg.textContent = 'Code requis';
             errorMsg.style.display = 'block';
             return;
        }
        // Redirect to share URL
        window.location.href = `/?share=${code}`;
        return;
    }

    const username = form.querySelector('#username').value;
    const password = form.querySelector('#password').value;
    const remember = form.querySelector('#remember').checked;
    
    try {
      if (isLogin) {
        const data = await API.login(username, password, remember);
        API.setToken(data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.firstname) localStorage.setItem('firstname', data.firstname);

        onLoginSuccess();
      } else {
        await API.register(username, password, form.querySelector('#firstname').value);
        // Auto login after register (default simple session)
        const data = await API.login(username, password, false);
        API.setToken(data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.firstname) localStorage.setItem('firstname', data.firstname);

        onLoginSuccess();
      }
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = 'block';
    }
  });

  return container;
}
