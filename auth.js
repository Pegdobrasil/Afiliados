// CONFIG API
const API_BASE = "https://painel-afiliados-production.up.railway.app/api";

// ========= Helpers =========
function v(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function notify(msg) {
  window.alert(msg);
}

function onlyDigits(str) {
  return (str || "").replace(/\D/g, "");
}

// ========= CEP =========
async function buscarCep() {
  var cep = onlyDigits(v("cep"));
  if (cep.length !== 8) return;
  try {
    var res = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
    var data = await res.json();
    if (data && data.erro) {
      notify("CEP não encontrado.");
      return;
    }
    var logEl = document.getElementById("logradouro");
    var bairroEl = document.getElementById("bairro");
    var cidadeEl = document.getElementById("cidade");
    var ufEl = document.getElementById("uf");
    if (logEl) logEl.value = data.logradouro || "";
    if (bairroEl) bairroEl.value = data.bairro || "";
    if (cidadeEl) cidadeEl.value = data.localidade || "";
    if (ufEl) ufEl.value = (data.uf || "").toUpperCase();
  } catch (err) {
    console.error(err);
    notify("Erro ao consultar CEP.");
  }
}

// ========= Cadastro =========
async function registrar() {
  var payload = {
    tipo_pessoa: v("tipo_pessoa"),
    cpf_cnpj: onlyDigits(v("cpf_cnpj")),
    nome: v("nome"),
    email: v("email"),
    telefone: v("telefone"),
    cep: onlyDigits(v("cep")),
    endereco: (function () {
      var lg = v("logradouro");
      var cp = v("complemento");
      return cp ? lg + " - " + cp : lg;
    })(),
    numero: v("numero"),
    bairro: v("bairro"),
    cidade: v("cidade"),
    estado: v("uf"),
    senha: v("senha")
  };

  for (var k in payload) {
    if (!payload[k]) {
      notify("Preencha todos os campos obrigatórios.");
      return;
    }
  }

  try {
    var res = await fetch(API_BASE + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      var errData = null;
      try { errData = await res.json(); } catch(e) {}
      notify((errData && errData.detail) || "Não foi possível concluir o cadastro.");
      return;
    }

    var data = null;
    try { data = await res.json(); } catch(e) {}
    notify((data && data.message) || "Cadastro realizado. Enviamos um link de ativação para o seu e-mail.");
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    notify("Erro de conexão ao tentar cadastrar.");
  }
}

// ========= Login =========
async function loginHandler(evt) {
  if (evt) evt.preventDefault();
  console.log("Login clicado");

  var email = v("email");
  var senha = v("senha");

  if (!email || !senha) {
    notify("Informe email e senha.");
    return;
  }

  try {
    var res = await fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, senha: senha })
    });

    if (!res.ok) {
      var errData = null;
      try { errData = await res.json(); } catch(e) {}
      notify((errData && errData.detail) || "Não foi possível fazer login.");
      return;
    }

    var data = null;
    try { data = await res.json(); } catch(e) {}
    console.log("Resposta login:", data);

    if (!data || data.status !== "success") {
      notify("Não foi possível fazer login.");
      return;
    }

    var session = {
      id: data.id,
      nome: data.nome,
      email: data.email,
      token: data.token,
      logged_at: new Date().toISOString()
    };
    localStorage.setItem("painel_afiliado_session", JSON.stringify(session));
    window.location.href = "painel.html";
  } catch (err) {
    console.error(err);
    notify("Erro de conexão ao tentar logar.");
  }
}

// ========= Recuperar conta =========
async function recuperarConta() {
  var email = window.prompt("Informe o email cadastrado:");
  if (!email) return;

  var nova_senha = window.prompt("Digite a nova senha que deseja usar:");
  if (!nova_senha) return;

  try {
    var res = await fetch(API_BASE + "/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, nova_senha: nova_senha })
    });

    if (!res.ok) {
      var errData = null;
      try { errData = await res.json(); } catch(e) {}
      notify((errData && errData.detail) || "Erro ao recuperar conta.");
      return;
    }

    var data = null;
    try { data = await res.json(); } catch(e) {}
    notify((data && data.message) || "Senha redefinida. Agora faça login com a nova senha.");
  } catch (err) {
    console.error(err);
    notify("Erro de conexão ao recuperar conta.");
  }
}

function cadastrarPrompt() {
  window.location.href = "cadastro.html";
}

// ========= Bind no botão =========
window.addEventListener("DOMContentLoaded", function () {
  console.log("auth.js carregado");
  var btn = document.getElementById("btn-login");
  if (btn) {
    btn.addEventListener("click", loginHandler);
  }
});
