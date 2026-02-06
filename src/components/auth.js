import { API } from '../api.js';

export function renderAuth(onLoginSuccess) {
  const container = document.createElement('div');
  container.className = 'auth-container';
  container.innerHTML = `
        <div class="dashboard-card" style="max-width: 400px; margin: 40px auto;">
            <h1 id="auth-title">Connexion</h1>
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px; margin-top: 24px;">
                <input type="text" id="username" placeholder="Nom d'utilisateur" required 
                    style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit;">
                <input type="password" id="password" placeholder="Mot de passe" required 
                    style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit;">
                <input type="text" id="firstname" placeholder="Prénom (optionnel)" 
                    style="padding: 12px; border-radius: 8px; border: 1px solid var(--color-secondary); font-family: inherit; display: none;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="remember" style="width: auto;">
                    <label for="remember" style="font-size: 0.9rem; color: var(--color-text-muted);">Rester connecté</label>
                </div>
                <button type="submit" class="btn-log" style="width: 100%; margin-top: 8px;">Se connecter</button>
            </form>
            <p style="margin-top: 16px; font-size: 0.875rem; color: var(--color-text-muted);">
                <span id="auth-switch-text">Pas de compte ?</span>
                <a href="#" id="auth-switch-btn" style="color: var(--color-primary-dark); font-weight: 600;">S'inscrire</a>
            </p>
            <div id="auth-error" style="color: #e57373; font-size: 0.875rem; margin-top: 12px; display: none;"></div>
        </div>
    `;

  let isLogin = true;

  const form = container.querySelector('#auth-form');
  const switchBtn = container.querySelector('#auth-switch-btn');
  const title = container.querySelector('#auth-title');
  const errorMsg = container.querySelector('#auth-error');

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
    form.firstname.style.display = isLogin ? 'none' : 'block';
  });
  
  
 
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = form.username.value;
    const password = form.password.value;
    const remember = form.querySelector('#remember').checked;
    errorMsg.style.display = 'none';

    try {
      if (isLogin) {
        const data = await API.login(username, password, remember);
        API.setToken(data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        onLoginSuccess();
      } else {
        await API.register(username, password, form.firstname.value);
        // Auto login after register (default simple session)
        const data = await API.login(username, password, false);
        API.setToken(data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        onLoginSuccess();
      }
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = 'block';
    }
  });

  return container;
}
