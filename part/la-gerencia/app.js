/*
 * app.js — La Gerencia · Centro de Control
 * Sistema de autenticación por usuario + contraseña (SHA-256)
 * Con verificación anti-bot (Authy: captcha matemático + honeypot)
 * © 2026 La Gerencia. Desarrollado por Willy.
 */
(() => {
  const CFG       = window.APP_CONFIG;
  const LS_MOVES  = "rc_moves_v2";
  const LS_SESSION= "rc_session_v2";
  const $ = (sel, root = document) => root.querySelector(sel);
  const fmt = n => new Intl.NumberFormat(CFG.LOCALE || "es-SV", {
    style: "currency", currency: CFG.CURRENCY || "USD"
  }).format(n || 0);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function loadJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
  function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  /* ── Captcha "Authy": genera reto matemático ── */
  function makeChallenge() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const ops = [
      { sym: "+", fn: (x,y) => x+y },
      { sym: "−", fn: (x,y) => x-y },
      { sym: "×", fn: (x,y) => x*y }
    ];
    const op = ops[Math.floor(Math.random() * ops.length)];
    return { a, b, op: op.sym, answer: op.fn(a,b), startedAt: Date.now() };
  }

  /* ════════════════════════════════════════
     PANTALLA DE LOGIN
  ════════════════════════════════════════ */
  async function renderGate() {
    const app = $("#app");
    let challenge = makeChallenge();

    app.innerHTML = `
      <div class="gate">
        <div class="card">
          <span class="eyebrow">Acceso restringido</span>
          <h1 class="brand">${esc(CFG.RESTAURANT_NAME)}</h1>
          <p class="muted" style="margin:0 0 22px">
            Panel privado · Solo personal autorizado.
          </p>

          <label>Usuario</label>
          <input id="username" type="text" placeholder="Tu nombre de usuario"
                 autocomplete="username" autocapitalize="none" spellcheck="false" />
          <div style="height:12px"></div>
          <label>Contraseña</label>
          <input id="password" type="password" placeholder="••••••••••••"
                 autocomplete="current-password" />

          <!-- Honeypot (invisible — atrapa bots que llenan todo) -->
          <input class="hp" id="website" name="website" type="text" tabindex="-1" autocomplete="off" />

          <!-- Captcha "Authy" -->
          <div class="captcha" id="captcha">
            <div class="captcha-check" id="capCheck" title="Marcar cuando lo resuelvas"></div>
            <div class="captcha-body">
              <div class="captcha-q">
                Verificación:
                <span class="num" id="capA">${challenge.a}</span>
                <span>${challenge.op}</span>
                <span class="num" id="capB">${challenge.b}</span>
                <span>=</span>
                <input class="captcha-input" id="capAns" type="number" inputmode="numeric" placeholder="?" autocomplete="off" />
              </div>
              <span class="captcha-hint">No soy un robot · resuelve la operación</span>
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
              <p class="muted" style="margin-top:8px;font-size:12px">
                Cierra la sesión guardada en este navegador y borra el historial local.
              </p>
              <div id="adminMsg"></div>
            </div>
          </details>
        </div>
      </div>`;

    // Auto-login si hay sesión guardada
    const session = loadJSON(LS_SESSION, null);
    if (session && session.username) return renderApp(session.username);

    const enterBtn = $("#enter");
    const capCheck = $("#capCheck");
    const capAns   = $("#capAns");

    function refreshChallenge() {
      challenge = makeChallenge();
      $("#capA").textContent = challenge.a;
      $("#capB").textContent = challenge.b;
      document.querySelector(".captcha-q span:nth-of-type(2)").textContent = challenge.op;
      capAns.value = "";
      capCheck.classList.remove("ok");
      enterBtn.disabled = true;
    }

    function validateCaptcha() {
      const ok = parseInt(capAns.value, 10) === challenge.answer;
      capCheck.classList.toggle("ok", ok);
      enterBtn.disabled = !ok;
      return ok;
    }

    capAns.addEventListener("input", validateCaptcha);
    capCheck.addEventListener("click", () => {
      if (!validateCaptcha()) {
        capAns.classList.add("shake");
        setTimeout(() => capAns.classList.remove("shake"), 500);
        capAns.focus();
      }
    });

    // Enter con teclado en cualquier campo
    ["username", "password", "capAns"].forEach(id => {
      $(`#${id}`).addEventListener("keydown", e => {
        if (e.key === "Enter" && !enterBtn.disabled) enterBtn.click();
      });
    });

    enterBtn.onclick = async () => {
      const msg = $("#msg"); msg.className = ""; msg.textContent = "";
      const card = document.querySelector(".gate .card");

      // Honeypot — si está lleno, es un bot
      if ($("#website").value.trim() !== "") {
        msg.className = "err";
        msg.textContent = "Verificación fallida.";
        return;
      }
      // Tiempo mínimo (bots responden instantáneo)
      if (Date.now() - challenge.startedAt < 1200) {
        msg.className = "err";
        msg.textContent = "Demasiado rápido. Intenta de nuevo.";
        refreshChallenge();
        return;
      }
      // Captcha
      if (!validateCaptcha()) {
        msg.className = "err";
        msg.textContent = "Resuelve la verificación primero.";
        capAns.classList.add("shake");
        setTimeout(() => capAns.classList.remove("shake"), 500);
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
        refreshChallenge();
        return;
      }

      saveJSON(LS_SESSION, { username: user.username, loggedAt: new Date().toISOString() });
      // Animación de salida
      card.style.transition = "opacity .35s, transform .35s";
      card.style.opacity = "0";
      card.style.transform = "translateY(-10px) scale(.98)";
      setTimeout(() => renderApp(user.username), 350);
    };

    // Reset maestro
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

  /* ════════════════════════════════════════
     PANEL PRINCIPAL
  ════════════════════════════════════════ */
  function renderApp(username) {
    const app  = $("#app");
    const cats = [...new Set((CFG.MENU || []).map(m => m.cat))];

    const menuHTML = cats.map(cat => `
      <div class="menu-cat">${esc(cat)}</div>
      <div class="menu-grid">
        ${(CFG.MENU || []).filter(m => m.cat === cat).map(m => `
          <button type="button" class="menu-item"
                  data-nm="${esc(m.nombre)}" data-pr="${m.precio}">
            <span class="nm">${esc(m.nombre)}</span>
            <span class="pr">${fmt(m.precio)}</span>
          </button>
        `).join("")}
      </div>`).join("");

    app.innerHTML = `
      <div class="container">
        <div class="topbar">
          <div>
            <span class="eyebrow">Centro de Control</span>
            <h1 class="brand" style="margin-top:4px">${esc(CFG.RESTAURANT_NAME)}</h1>
          </div>
          <div class="row" style="flex:0 0 auto;align-items:center">
            <span class="pill">👤 ${esc(username)}</span>
            <button class="ghost" id="logout" style="width:auto">Cerrar sesión</button>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi"><span>Ingresos</span><b id="kIn">$0</b></div>
          <div class="kpi"><span>Egresos</span><b id="kOut">$0</b></div>
          <div class="kpi"><span>Balance</span><b id="kBal">$0</b></div>
        </div>

        <div class="card" style="margin-bottom:18px">
          <h3>Nuevo movimiento</h3>
          <div class="row">
            <div>
              <label>Tipo</label>
              <select id="tipo">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label>Concepto</label>
              <input id="concepto" placeholder="Ej. Mesa 5 — Plato La Gerencia" />
            </div>
            <div>
              <label>Monto</label>
              <input id="monto" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div>
              <label>Método de pago</label>
              <select id="metodo">
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
                <option>Otro</option>
              </select>
            </div>
          </div>
          <div style="height:12px"></div>
          <button id="add">Agregar movimiento</button>
          <div id="addMsg"></div>

          <hr class="div" />
          <span class="eyebrow">Carta — clic para sumar al monto</span>
          ${menuHTML}
        </div>

        <div class="card">
          <div class="topbar" style="margin:0 0 8px;padding:0;border:0;background:none">
            <h3 style="margin:0">Movimientos</h3>
            <div class="row" style="flex:0 0 auto">
              <button class="ghost" id="export" style="width:auto">Exportar CSV</button>
              <button class="danger" id="clearAll" style="width:auto">Borrar todo</button>
            </div>
          </div>
          <div style="overflow:auto">
            <table>
              <thead><tr>
                <th>Fecha</th><th>Tipo</th><th>Concepto</th>
                <th>Método</th><th style="text-align:right">Monto</th>
                <th>Usuario</th><th></th>
              </tr></thead>
              <tbody id="tbody"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    document.querySelectorAll(".menu-item").forEach(b => b.onclick = () => {
      const nm = b.getAttribute("data-nm");
      const pr = parseFloat(b.getAttribute("data-pr")) || 0;
      const c  = $("#concepto");
      c.value  = c.value ? `${c.value} + ${nm}` : nm;
      const m  = $("#monto");
      m.value  = ((parseFloat(m.value) || 0) + pr).toFixed(2);
      $("#tipo").value = "ingreso";
      // pequeño feedback
      b.style.transform = "scale(.95)";
      setTimeout(() => b.style.transform = "", 150);
    });

    $("#logout").onclick = () => {
      localStorage.removeItem(LS_SESSION);
      renderGate();
    };

    $("#add").onclick = () => {
      const m = {
        id: uid(), fecha: new Date().toISOString(),
        tipo: $("#tipo").value,
        concepto: $("#concepto").value.trim().slice(0, 200),
        monto: Number($("#monto").value),
        metodo: $("#metodo").value,
        usuario: username
      };
      const msg = $("#addMsg"); msg.className = ""; msg.textContent = "";
      if (!m.concepto) { msg.className = "err"; msg.textContent = "Falta el concepto."; return; }
      if (!(m.monto > 0)) { msg.className = "err"; msg.textContent = "Monto inválido."; return; }
      const list = loadJSON(LS_MOVES, []);
      list.unshift(m);
      saveJSON(LS_MOVES, list);
      $("#concepto").value = ""; $("#monto").value = "";
      msg.className = "ok"; msg.textContent = "✓ Movimiento guardado.";
      setTimeout(() => { if (msg.textContent.startsWith("✓")) msg.textContent = ""; }, 3000);
      renderTable();
    };

    $("#clearAll").onclick = () => {
      if (confirm("¿Borrar TODOS los movimientos? Esta acción no se puede deshacer.")) {
        localStorage.removeItem(LS_MOVES);
        renderTable();
      }
    };

    $("#export").onclick = () => {
      const list = loadJSON(LS_MOVES, []);
      const head = ["fecha", "tipo", "concepto", "metodo", "monto", "usuario"];
      const rows = [head.join(",")].concat(list.map(m =>
        head.map(k => `"${String(m[k] ?? "").replace(/"/g, '""')}"`).join(",")));
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    };

    function renderTable() {
      const list = loadJSON(LS_MOVES, []);
      let inSum = 0, outSum = 0;
      list.forEach(m => m.tipo === "ingreso" ? inSum += +m.monto : outSum += +m.monto);
      $("#kIn").textContent  = fmt(inSum);
      $("#kOut").textContent = fmt(outSum);
      const bal = $("#kBal");
      bal.textContent = fmt(inSum - outSum);
      bal.style.color = inSum - outSum >= 0 ? "var(--good)" : "var(--bad)";

      $("#tbody").innerHTML = list.map(m => `
        <tr>
          <td>${new Date(m.fecha).toLocaleString(CFG.LOCALE || "es-SV")}</td>
          <td><span class="badge ${m.tipo === 'ingreso' ? 'in' : 'out'}">${m.tipo}</span></td>
          <td>${esc(m.concepto)}</td>
          <td>${esc(m.metodo)}</td>
          <td style="text-align:right">${fmt(m.monto)}</td>
          <td class="muted">${esc(m.usuario || "")}</td>
          <td><button class="ghost" data-del="${m.id}" style="width:auto">×</button></td>
        </tr>`).join("") ||
        `<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">
          Sin movimientos todavía.
        </td></tr>`;

      document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
        const id = b.getAttribute("data-del");
        const list = loadJSON(LS_MOVES, []).filter(x => x.id !== id);
        saveJSON(LS_MOVES, list);
        renderTable();
      });
    }
    renderTable();
  }

  renderGate();
})();
