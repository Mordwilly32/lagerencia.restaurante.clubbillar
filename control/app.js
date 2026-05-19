import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Configuración de Firebase que proporcionaste
const firebaseConfig = {
  apiKey: "AIzaSyCFi2QgrzMGVF4p6Qifco7-bDyHiUjTZPQ",
  authDomain: "lagerencia.firebaseapp.com",
  projectId: "lagerencia",
  storageBucket: "lagerencia.firebasestorage.app",
  messagingSenderId: "1017966339895",
  appId: "1:1017966339895:web:f07cde469c86e51114dcb2",
  measurementId: "G-E3K1YXXD03"
};

// Inicializar Firebase
const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

const CFG = window.APP_CONFIG;
const LS_SESSION= "rc_session_v2";
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = n => new Intl.NumberFormat(CFG.LOCALE || "es-SV", {
  style: "currency", currency: CFG.CURRENCY || "USD"
}).format(n || 0);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function loadJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

async function renderGate() {
  document.body.classList.remove("app-mode");
  const app = $("#app");
  app.innerHTML = `
    <div class="gate">
      <div class="gate-card">
        <div class="gate-form">
          <h2>Iniciar Sesión</h2>

          <label>Usuario</label>
          <input id="username" type="text" placeholder="Tu nombre de usuario" autocomplete="username" autocapitalize="none" spellcheck="false" />
          <div style="height:12px"></div>
          <label>Contraseña</label>
          <input id="password" type="password" placeholder="••••••••••••" autocomplete="current-password" />

          <input class="hp" id="website" name="website" type="text" tabindex="-1" autocomplete="off" />

          <div class="recaptcha-wrap">
            <div class="g-recaptcha" data-sitekey="${esc(window.RECAPTCHA_SITE_KEY || '')}" data-callback="onCaptchaOk" data-expired-callback="onCaptchaExpired" data-theme="dark"></div>
          </div>

          <div style="height:14px"></div>
          <button id="enter" disabled>Iniciar sesión</button>
          <div id="msg"></div>
        </div>

        <div class="gate-side">
          <img class="logo" src="./imagenes/logo.png" alt="${esc(CFG.RESTAURANT_NAME)}" />
        </div>
      </div>
    </div>`;

  const session = loadJSON(LS_SESSION, null);
  if (session && session.username) return renderApp(session.username);

  const enterBtn = $("#enter");
  let captchaOk = false;
  window.onCaptchaOk = () => { captchaOk = true; enterBtn.disabled = false; };
  window.onCaptchaExpired = () => { captchaOk = false; enterBtn.disabled = true; };

  ["username", "password"].forEach(id => {
    $(`#${id}`).addEventListener("keydown", e => {
      if (e.key === "Enter" && !enterBtn.disabled) enterBtn.click();
    });
  });

  enterBtn.onclick = async () => {
    const msg = $("#msg"); msg.className = ""; msg.textContent = "";
    const card = document.querySelector(".gate .gate-card");

    if ($("#website").value.trim() !== "") {
      msg.className = "err"; msg.textContent = "Verificación fallida."; return;
    }
    const token = (window.grecaptcha && grecaptcha.getResponse) ? grecaptcha.getResponse() : "";
    if (!captchaOk || !token) {
      msg.className = "err"; msg.textContent = "Completa la verificación reCAPTCHA."; return;
    }

    const uname = $("#username").value.trim();
    const pass  = $("#password").value;
    if (!uname || !pass) {
      msg.className = "err"; msg.textContent = "Completa usuario y contraseña."; return;
    }

    const hash = await sha256(pass);
    const user = (CFG.USERS || []).find(u =>
      u.username.toLowerCase() === uname.toLowerCase() &&
      u.passwordHash.toLowerCase() === hash.toLowerCase()
    );

    if (!user) {
      msg.className = "err"; msg.textContent = "Usuario o contraseña incorrectos.";
      $("#password").value = "";
      card.classList.add("shake");
      setTimeout(() => card.classList.remove("shake"), 500);
      if (window.grecaptcha) { try { grecaptcha.reset(); } catch(_){} }
      captchaOk = false; enterBtn.disabled = true;
      return;
    }

    saveJSON(LS_SESSION, { username: user.username, loggedAt: new Date().toISOString() });
    card.style.transition = "opacity .35s, transform .35s";
    card.style.opacity = "0";
    card.style.transform = "translateY(-10px) scale(.98)";
    setTimeout(() => renderApp(user.username), 350);
  };
}

function renderApp(username) {
  document.body.classList.add("app-mode");
  const app  = $("#app");
  const cats = [...new Set((CFG.MENU || []).map(m => m.cat))];
  
  // Variable para almacenar temporalmente los movimientos descargados de Firebase
  let currentMoves = [];

  const menuHTML = cats.map(cat => `
    <div class="menu-cat">${esc(cat)}</div>
    <div class="menu-grid">
      ${(CFG.MENU || []).filter(m => m.cat === cat).map(m => `
        <button type="button" class="menu-item" data-nm="${esc(m.nombre)}" data-pr="${m.precio}">
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
    b.style.transform = "scale(.95)";
    setTimeout(() => b.style.transform = "", 150);
  });

  $("#logout").onclick = () => {
    localStorage.removeItem(LS_SESSION);
    renderGate();
  };

  // Guardar en Firestore en lugar de LocalStorage
  $("#add").onclick = async () => {
    const msg = $("#addMsg"); msg.className = ""; msg.textContent = "";
    const concepto = $("#concepto").value.trim().slice(0, 200);
    const monto = Number($("#monto").value);

    if (!concepto) { msg.className = "err"; msg.textContent = "Falta el concepto."; return; }
    if (!(monto > 0)) { msg.className = "err"; msg.textContent = "Monto inválido."; return; }

    const m = {
      fecha: new Date().toISOString(), // Usamos timestamp de ISO
      timestamp: Date.now(), // Útil para ordenar en Firestore
      tipo: $("#tipo").value,
      concepto: concepto,
      monto: monto,
      metodo: $("#metodo").value,
      usuario: username
    };

    try {
      await addDoc(collection(db, "movimientos"), m);
      $("#concepto").value = ""; $("#monto").value = "";
      msg.className = "ok"; msg.textContent = "✓ Movimiento guardado en la nube.";
      setTimeout(() => { if (msg.textContent.startsWith("✓")) msg.textContent = ""; }, 3000);
    } catch (e) {
      console.error("Error agregando documento: ", e);
      msg.className = "err"; msg.textContent = "Error al guardar en la base de datos.";
    }
  };

  // Borrado en lote (Batch) en Firestore
  $("#clearAll").onclick = async () => {
    if (confirm("¿Borrar TODOS los movimientos en la nube? Esta acción afectará a todos los dispositivos.")) {
      try {
        const querySnapshot = await getDocs(collection(db, "movimientos"));
        const batch = writeBatch(db);
        querySnapshot.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
        alert("Todos los movimientos han sido borrados.");
      } catch(e) {
         console.error("Error al borrar todo:", e);
      }
    }
  };

  $("#export").onclick = () => {
    const head = ["fecha", "tipo", "concepto", "metodo", "monto", "usuario"];
    const rows = [head.join(",")].concat(currentMoves.map(m =>
      head.map(k => `"${String(m[k] ?? "").replace(/"/g, '""')}"`).join(",")));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  function renderTableUI(list) {
    let inSum = 0, outSum = 0;
    list.forEach(m => m.tipo === "ingreso" ? inSum += +m.monto : outSum += +m.monto);
    $("#kIn").textContent  = fmt(inSum);
    $("#kOut").textContent = fmt(outSum);
    const bal = $("#kBal");
    bal.textContent = fmt(inSum - outSum);
    bal.style.color = inSum - outSum >= 0 ? "#111" : "#b00020";

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

    // Botón de eliminar documento individual en Firestore
    document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      const id = b.getAttribute("data-del");
      try {
        await deleteDoc(doc(db, "movimientos", id));
      } catch(e) {
        console.error("Error eliminando documento:", e);
      }
    });
  }

  // Escuchar cambios en tiempo real desde Firestore
  const q = query(collection(db, "movimientos"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    currentMoves = list; // Guardamos en memoria para exportar a CSV
    renderTableUI(list);
  }, (error) => {
    console.error("Error escuchando cambios de Firestore:", error);
  });
}

// Iniciar aplicación
renderGate();
