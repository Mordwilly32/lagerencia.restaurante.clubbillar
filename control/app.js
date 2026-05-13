async function renderGate() {
    document.body.classList.remove("app-mode");
    const app = $("#app");
    
    // Generar el reto matemático inicial
    let challenge = makeChallenge();

    app.innerHTML = `
      <div class="gate">
        <div class="gate-card">
          <div class="gate-form">
            <h2>Iniciar Sesión</h2>

            <label>Usuario</label>
            <input id="username" type="text" placeholder="Tu nombre de usuario"
                   autocomplete="username" autocapitalize="none" spellcheck="false" />
            <div style="height:12px"></div>
            <label>Contraseña</label>
            <input id="password" type="password" placeholder="••••••••••••"
                   autocomplete="current-password" />

            <input class="hp" id="website" name="website" type="text" tabindex="-1" autocomplete="off" />

            <!-- NUEVO CAPTCHA MATEMÁTICO LOCAL -->
            <div class="captcha">
              <div class="captcha-check" id="btnCheck"></div>
              <div class="captcha-body">
                <div class="captcha-q">
                  <span>¿Cuánto es</span>
                  <span class="num" id="capA">${challenge.a}</span>
                  <span id="capOp">${challenge.op}</span>
                  <span class="num" id="capB">${challenge.b}</span>
                  <span>?</span>
                  <input type="number" id="captchaAns" class="captcha-input" placeholder="0" />
                </div>
                <span class="captcha-hint">Verificación de seguridad</span>
              </div>
            </div>

            <div style="height:14px"></div>
            <button id="enter" disabled>Iniciar sesión</button>
            <div id="msg"></div>

            <hr class="div" />
            <details>
              <summary>Administración · Reset de sesiones</summary>
              <div style="margin-top:14px">
                <label>Código maestro</label>
                <input id="admin" type="password" placeholder="Solo gerencia" autocomplete="off" />
                <div style="height:8px"></div>
                <button class="danger" id="resetBtn">Cerrar todas las sesiones</button>
                <div id="adminMsg"></div>
              </div>
            </details>
          </div>

          <div class="gate-side">
            <img class="logo" src="../imagenes/logo.png" alt="${esc(CFG.RESTAURANT_NAME)}" />
          </div>
        </div>
      </div>`;

    const session = loadJSON(LS_SESSION, null);
    if (session && session.username) return renderApp(session.username);

    const enterBtn = $("#enter");
    let captchaOk = false;

    // Lógica para validar el captcha matemático
    $("#captchaAns").addEventListener("input", (e) => {
      if (parseInt(e.target.value) === challenge.answer) {
        captchaOk = true;
        $("#btnCheck").classList.add("ok");
        enterBtn.disabled = false;
        e.target.disabled = true; // Congelar al adivinar
      } else {
        captchaOk = false;
        $("#btnCheck").classList.remove("ok");
        enterBtn.disabled = true;
      }
    });

    ["username", "password"].forEach(id => {
      $(`#${id}`).addEventListener("keydown", e => {
        if (e.key === "Enter" && !enterBtn.disabled) enterBtn.click();
      });
    });

    enterBtn.onclick = async () => {
      const msg = $("#msg"); msg.className = ""; msg.textContent = "";
      const card = document.querySelector(".gate .gate-card");

      if ($("#website").value.trim() !== "") {
        msg.className = "err";
        msg.textContent = "Verificación fallida.";
        return;
      }
      
      if (!captchaOk) {
        msg.className = "err";
        msg.textContent = "Completa la verificación matemática.";
        return;
      }

      const uname = $("#username").value.trim();
      const pass  = $("#password").value;
      if (!uname || !pass) {
        msg.className = "err";
        msg.textContent = "Completa usuario y contraseña.";
        return;
      }

      const hash = await sha256(pass);
      const user = (CFG.USERS || []).find(u =>
        u.username.toLowerCase() === uname.toLowerCase() &&
        u.passwordHash.toLowerCase() === hash.toLowerCase()
      );

      if (!user) {
        msg.className = "err";
        msg.textContent = "Usuario o contraseña incorrectos.";
        $("#password").value = "";
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 500);
        
        // Resetear el captcha en caso de fallo
        challenge = makeChallenge();
        $("#capA").textContent = challenge.a;
        $("#capOp").textContent = challenge.op;
        $("#capB").textContent = challenge.b;
        $("#captchaAns").value = "";
        $("#captchaAns").disabled = false;
        captchaOk = false; 
        $("#btnCheck").classList.remove("ok");
        enterBtn.disabled = true;
        
        return;
      }

      saveJSON(LS_SESSION, { username: user.username, loggedAt: new Date().toISOString() });
      card.style.transition = "opacity .35s, transform .35s";
      card.style.opacity = "0";
      card.style.transform = "translateY(-10px) scale(.98)";
      setTimeout(() => renderApp(user.username), 350);
    };

    $("#resetBtn").onclick = async () => {
      const msg = $("#adminMsg"); msg.className = ""; msg.textContent = "";
      const a = $("#admin").value.trim();
      if (!a) { msg.className = "err"; msg.textContent = "Ingresa el código maestro."; return; }
      const h = await sha256(a);
      if (h !== (CFG.ADMIN_RESET_HASH || "").toLowerCase()) {
        msg.className = "err"; msg.textContent = "Código maestro incorrecto."; return;
      }
      localStorage.removeItem(LS_SESSION);
      localStorage.removeItem(LS_MOVES);
      msg.className = "ok"; msg.textContent = "Sesión y datos borrados correctamente.";
      $("#admin").value = "";
    };
  }
