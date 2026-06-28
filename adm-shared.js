/* ════════════════════════════════════════════════════════════
   AQUASHRIMPTECH ADM — SHELL COMPARTILHADO (login + sidebar + api)
   Inclua <script src="adm-shared.js"></script> em toda nova página
   do ADM, junto com adm-shared.css. Depois chame:

     AdmShell.init({
       activeKey: 'kits',                // identifica este módulo no menu
       pageTitle: '📦 Kits de Custo',     // título mostrado na topbar
       onReady: function(){ ... }         // chamado já autenticado
     });

   O token de admin é salvo em localStorage com a MESMA chave usada
   pelo adm.html original ('ast_admin_token') — ou seja, se a pessoa
   já está logada no adm.html, ela já entra direto aqui também.
   ════════════════════════════════════════════════════════════ */
(function (global) {
  const ADM_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwj5evRjINYVQVBBUMvGlKZWWCEfAq5yvFIYkv8vVYi875DU9-fXtPg1GuIeo8jFi9p/exec";

  // ★ Adicione aqui novos módulos conforme forem sendo criados.
  //   href === null  -> ainda não existe: aparece no menu TRAVADO ("Em breve"),
  //   pra você já ver a visão completa da empresa. Quando o arquivo .html
  //   estiver pronto, é só trocar o null pelo nome do arquivo — 1 linha,
  //   nesse arquivo só, e o link já fica ativo em TODAS as páginas de uma vez.
  //   Os que apontam pra "adm.html" abrem o painel principal (cai no Dashboard).
  const NAV_ITEMS = [
    { sec: "Principal" },
    { key: "dash",       label: "📊 Dashboard",        href: "adm.html" },
    { key: "clientes",   label: "👥 Clientes",         href: "adm.html" },
    { key: "financeiro", label: "💰 Financeiro",       href: "adm.html" },
    { key: "cobrancas",  label: "📄 Cobranças",        href: "adm.html" },
    { sec: "Operacional" },
    { key: "alertas",    label: "🔔 Alertas",          href: "adm.html" },
    { key: "mapa",       label: "🗺️ Mapa de Viveiros", href: "adm.html" },
    { key: "mensagens",  label: "💬 Mensagens",        href: "adm.html" },
    { key: "bots",       label: "🤖 Gerenciar Bots",   href: "adm.html" },
    { key: "kits",       label: "📦 Kits de Custo",    href: "kits.html" },
    { key: "pipeline",   label: "🛠️ Fila de Instalação", href: "pipeline.html" },
    { sec: "Estoque & Equipe" },
    { key: "estoque2",   label: "🏭 Estoque Geral",    href: "estoque-geral.html" },
    { key: "funcionarios", label: "👷 Funcionários",   href: "funcionarios.html" },
    { sec: "Financeiro ADM" },
    { key: "fin",        label: "📈 Unit Economics",   href: "adm.html" },
    { sec: "Sistema" },
    { key: "config",     label: "⚙️ Configurações",    href: "adm.html" },
  ];

  let ADMIN_TOKEN = localStorage.getItem("ast_admin_token") || "";
  let _onReady = null;

  // ── API ──────────────────────────────────────────────────────
  async function api(params) {
    if (ADMIN_TOKEN) params = { ...params, token: ADMIN_TOKEN };
    const url = ADM_SCRIPT_URL + "?" + new URLSearchParams(params).toString();
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data.status === "erro" && /acesso negado/i.test(data.msg || "")) {
      localStorage.removeItem("ast_admin_token");
      ADMIN_TOKEN = "";
      toast("Token expirado — faça login novamente.", "e");
      logout();
    }
    return data;
  }

  // ── TOAST ────────────────────────────────────────────────────
  function toast(msg, tipo) {
    tipo = tipo || "i";
    const ic = { s: "✅", e: "❌", i: "ℹ️" }[tipo];
    const el = document.createElement("div");
    el.className = "toast " + tipo;
    el.innerHTML = "<span>" + ic + "</span><span>" + msg + "</span>";
    document.getElementById("tc").appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  // ── MODAIS ───────────────────────────────────────────────────
  function openM(id) { document.getElementById(id).classList.add("open"); }
  function closeM(id) { document.getElementById(id).classList.remove("open"); }

  // ── RELÓGIO ──────────────────────────────────────────────────
  function tick() {
    const el = document.getElementById("clk");
    if (el) el.textContent = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
  }

  // ── SIDEBAR / TOPBAR (injetados via JS — sem precisar copiar HTML) ──
  function montarSidebarHTML(activeKey) {
    let nav = "";
    NAV_ITEMS.forEach((item) => {
      if (item.sec) { nav += `<div class="nav-sec">${item.sec}</div>`; return; }
      if (!item.href) {
        // ★ módulo ainda não existe — mostra travado, não esconde.
        nav += `<div class="ni disabled" title="Em breve">${item.label}<span class="ni-soon">🔒</span></div>`;
        return;
      }
      const act = item.key === activeKey ? " act" : "";
      nav += `<a class="ni${act}" href="${item.href}">${item.label}</a>`;
    });
    return `
    <div class="sb-ov" id="sb-ov" onclick="AdmShell.toggleSB()"></div>
    <aside class="sb" id="sb">
      <div class="sb-logo">
        <div><div class="sb-brand">AQUASHRIMP</div><div style="font-size:.5rem;color:var(--text3);letter-spacing:.12em;text-transform:uppercase">ADM · Gestão</div></div>
        <div class="sb-tag">ADM</div>
      </div>
      <nav class="sb-nav">${nav}</nav>
      <div class="sb-ft">
        <div class="sb-user">
          <div class="sb-av">A</div>
          <div><div class="sb-nm">Admin</div><div class="sb-rl">Proprietário</div></div>
          <button class="lo-btn" onclick="AdmShell.logout()" title="Sair">⏻</button>
        </div>
      </div>
    </aside>`;
  }

  function montarTopbarHTML(pageTitle) {
    return `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="hamburger" onclick="AdmShell.toggleSB()">☰</button>
        <div class="tb-title">${pageTitle}</div>
      </div>
      <div class="tb-r">
        <div class="tb-clk" id="clk">--:--:--</div>
      </div>
    </div>`;
  }

  function montarLoginHTML() {
    return `
    <div class="lw">
      <div style="text-align:center">
        <div class="lb">ADM PANEL</div>
        <div style="font-size:.62rem;color:var(--text3);letter-spacing:.18em;text-transform:uppercase;margin-top:-16px">AquaShrimpTech · Gestão Empresarial</div>
      </div>
      <div class="lcard">
        <div class="ltitle">🔐 Acesso Administrativo</div>
        <div class="ldesc">Área restrita — somente gestores autorizados</div>
        <div class="lf"><label>Usuário ADM</label><input id="shell-au" type="text" placeholder="admin" autocomplete="off" onkeydown="if(event.key==='Enter')AdmShell.login()"></div>
        <div class="lf"><label>Senha</label><input id="shell-ap" type="password" placeholder="••••••••" autocomplete="off" onkeydown="if(event.key==='Enter')AdmShell.login()"></div>
        <button class="lbtn" id="shell-lbtn" onclick="AdmShell.login()">Entrar no Painel ADM</button>
        <div class="lerr" id="shell-lerr">Credenciais inválidas.</div>
        <a href="adm.html" style="display:block;text-align:center;margin-top:12px;font-size:.72rem;color:var(--text3);text-decoration:none">← Voltar ao painel principal</a>
      </div>
    </div>`;
  }

  // ── LOGIN / LOGOUT ───────────────────────────────────────────
  async function login() {
    const token = (document.getElementById("shell-ap").value || "").trim();
    const lerr = document.getElementById("shell-lerr");
    const lbtn = document.getElementById("shell-lbtn");
    lerr.style.display = "none";
    if (!token) { lerr.textContent = "Informe a senha / token admin."; lerr.style.display = "block"; return; }
    lbtn.disabled = true; lbtn.textContent = "Verificando...";
    ADMIN_TOKEN = token;
    try {
      const data = await api({ acao: "dashboard" });
      if (data && data.status === "ok") {
        localStorage.setItem("ast_admin_token", ADMIN_TOKEN);
        mostrarApp();
      } else {
        ADMIN_TOKEN = "";
        lerr.textContent = data.msg || "Token inválido. Acesso negado.";
        lerr.style.display = "block";
      }
    } catch (e) {
      ADMIN_TOKEN = "";
      lerr.textContent = "Erro de conexão com o servidor.";
      lerr.style.display = "block";
    }
    lbtn.disabled = false; lbtn.textContent = "Entrar no Painel ADM";
  }

  function logout() {
    if (!confirm("Sair do painel ADM?")) return;
    localStorage.removeItem("ast_admin_token");
    ADMIN_TOKEN = "";
    document.getElementById("app").style.display = "none";
    document.getElementById("ls").style.display = "flex";
  }

  function mostrarApp() {
    document.getElementById("ls").style.display = "none";
    document.getElementById("app").style.display = "block";
    setInterval(tick, 1000); tick();
    if (typeof _onReady === "function") _onReady();
  }

  function toggleSB() {
    document.getElementById("sb").classList.toggle("open");
    document.getElementById("sb-ov").classList.toggle("open");
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init(opts) {
    opts = opts || {};
    _onReady = opts.onReady;

    // injeta a estrutura básica no <body> (login + app shell)
    const lsDiv = document.createElement("div");
    lsDiv.id = "ls";
    lsDiv.innerHTML = montarLoginHTML();
    document.body.insertBefore(lsDiv, document.body.firstChild);

    const appDiv = document.getElementById("app");
    if (!appDiv) { console.error("AdmShell.init: falta <div id='app'> na página."); return; }
    const shellWrap = document.createElement("div");
    shellWrap.innerHTML = montarSidebarHTML(opts.activeKey) + `<div class="main"></div>`;
    // ★ tudo (sidebar + overlay + .main) precisa ficar DENTRO de #app —
    //   é o display:none/block de #app que controla "logado ou não".
    //   Se o sidebar ficasse fora, ele apareceria antes do login.
    const novosNodes = Array.from(shellWrap.childNodes);
    novosNodes.forEach((node) => {
      if (node.classList && node.classList.contains("main")) {
        node.innerHTML = montarTopbarHTML(opts.pageTitle || "");
        // move o conteúdo que já estava dentro de #app (a página em si) pra dentro do .main novo
        while (appDiv.firstChild) node.appendChild(appDiv.firstChild);
      }
      appDiv.appendChild(node);
    });

    // toast container
    if (!document.getElementById("tc")) {
      const tc = document.createElement("div");
      tc.id = "tc"; tc.className = "tc";
      document.body.appendChild(tc);
    }

    // fecha modal clicando fora
    document.querySelectorAll(".ov").forEach((o) =>
      o.addEventListener("click", (e) => { if (e.target === o) o.classList.remove("open"); })
    );

    // auto-login se já tem token salvo
    if (ADMIN_TOKEN) {
      api({ acao: "dashboard" }).then((data) => {
        if (data && data.status === "ok") mostrarApp();
        else { localStorage.removeItem("ast_admin_token"); ADMIN_TOKEN = ""; }
      }).catch(() => {});
    }
  }

  global.AdmShell = { init, api, toast, openM, closeM, login, logout, toggleSB };
})(window);
