const API_BASE = "https://painel-afiliados-production.up.railway.app/api";

(function () {
  const raw =
    localStorage.getItem("painel_afiliado_session") ||
    localStorage.getItem("afiliado_session");
  if (!raw) {
    window.location.href = "index.html";
    return;
  }

  let session = null;
  try {
    session = JSON.parse(raw);
  } catch (e) {
    console.error(e);
    window.location.href = "index.html";
    return;
  }

  if (!session || !session.token || !session.id) {
    window.location.href = "index.html";
    return;
  }
})();

// ==========================
// Funções utilitárias
// ==========================
function getSession() {
  const raw =
    localStorage.getItem("painel_afiliado_session") ||
    localStorage.getItem("afiliado_session");
  return raw ? JSON.parse(raw) : null;
}

function msgConta(text, tipo = "info") {
  const el = document.getElementById("msg_conta");
  if (!el) return;
  el.textContent = text || "";
  el.className =
    "text-xs mt-2 " + (tipo === "erro" ? "text-red-600" : "text-gray-500");
}

function msgSenha(text, tipo = "info") {
  const el = document.getElementById("msg_senha");
  if (!el) return;
  el.textContent = text || "";
  el.className =
    "text-xs mt-2 " + (tipo === "erro" ? "text-red-600" : "text-gray-500");
}

function formatarValor(valor) {
  if (valor == null || isNaN(valor)) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function loaderTexto(id, texto) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto;
}

function limparTabela(idTabela) {
  const corpo = document.getElementById(idTabela);
  if (corpo) corpo.innerHTML = "";
}

function criarCelula(tr, texto) {
  const td = document.createElement("td");
  td.className = "px-3 py-2 whitespace-nowrap text-[11px] text-slate-200";
  td.textContent = texto;
  tr.appendChild(td);
}

// ==========================
// Painel: saldo / pedidos / produtos
// ==========================
async function carregarSaldo(usuarioId) {
  try {
    const res = await fetch(`${API_BASE}/painel/saldo/${usuarioId}`);
    if (!res.ok) {
      console.error("Erro ao carregar saldo");
      return;
    }
    const data = await res.json();
    const saldoEl = document.getElementById("saldo");
    const itensEl = document.getElementById("itensIntegrados");
    const pedidosEl = document.getElementById("pedidos");

    if (saldoEl) saldoEl.textContent = formatarValor(data.saldo || 0);
    if (itensEl) itensEl.textContent = data.itens_integrados || 0;
    if (pedidosEl) pedidosEl.textContent = data.pedidos || 0;
  } catch (err) {
    console.error("Erro ao carregar saldo:", err);
  }
}

async function carregarPedidos(usuarioId) {
  limparTabela("tabelaPedidos");
  loaderTexto("tabelaPedidos", "");

  try {
    const res = await fetch(`${API_BASE}/painel/pedidos/${usuarioId}`);
    if (!res.ok) {
      console.error("Erro ao carregar pedidos");
      return;
    }
    const data = await res.json();
    const corpo = document.getElementById("tabelaPedidos");
    if (!corpo) return;

    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className =
        "px-3 py-3 text-center text-[11px] text-slate-400 italic";
      td.textContent = "Nenhum pedido encontrado.";
      tr.appendChild(td);
      corpo.appendChild(tr);
      return;
    }

    data.forEach((pedido) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/80";

      criarCelula(tr, pedido.codigo || "-");
      criarCelula(tr, formatarValor(pedido.valor || 0));
      criarCelula(tr, pedido.data_criacao || "-");

      corpo.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
  }
}

async function carregarProdutos(usuarioId) {
  limparTabela("tabelaProdutos");

  try {
    const res = await fetch(`${API_BASE}/painel/produtos/${usuarioId}`);
    if (!res.ok) {
      console.error("Erro ao carregar produtos");
      return;
    }
    const data = await res.json();
    const corpo = document.getElementById("tabelaProdutos");
    if (!corpo) return;

    if (!data || !data.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className =
        "px-3 py-3 text-center text-[11px] text-slate-400 italic";
      td.textContent = "Nenhum produto integrado ainda.";
      tr.appendChild(td);
      corpo.appendChild(tr);
      return;
    }

    data.forEach((produto) => {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-800/80";
      criarCelula(tr, produto.sku || "-");
      criarCelula(tr, produto.nome || "-");
      criarCelula(tr, produto.situacao || "Ativo");
      corpo.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

// ==========================
// Link de afiliado
// ==========================
function gerarLink() {
  const session = getSession();
  if (!session || !session.id) {
    alert("Sessão inválida. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  const urlProduto = document.getElementById("urlProduto")?.value.trim();
  const saida = document.getElementById("linkAfiliado");

  if (!urlProduto) {
    alert("Cole a URL do produto.");
    return;
  }

  const link = `${urlProduto}${
    urlProduto.includes("?") ? "&" : "?"
  }afiliado=${encodeURIComponent(session.id)}`;

  if (saida) saida.textContent = link;
}

// ==========================
// Minha conta / alterar senha
// ==========================
async function carregarMinhaConta(usuarioId) {
  try {
    const res = await fetch(`${API_BASE}/painel/minha-conta/${usuarioId}`);
    if (!res.ok) {
      msgConta("Não foi possível carregar seus dados.", "erro");
      return;
    }
    const data = await res.json();

    const campos = [
      "conta_nome",
      "conta_email",
      "conta_telefone",
      "conta_tipo_pessoa",
      "conta_cpf_cnpj",
      "conta_endereco",
      "conta_bairro",
      "conta_cidade",
      "conta_estado",
      "conta_cep",
    ];

    campos.forEach((id) => {
      const el = document.getElementById(id);
      const campo = id.replace("conta_", "");
      if (el && data[campo] !== undefined) {
        el.value = data[campo] || "";
      }
    });
  } catch (err) {
    console.error("Erro ao carregar conta:", err);
    msgConta("Erro ao carregar dados da conta.", "erro");
  }
}

async function salvarMinhaConta() {
  const session = getSession();
  if (!session || !session.id) {
    msgConta("Sessão inválida. Faça login novamente.", "erro");
    window.location.href = "index.html";
    return;
  }

  const payload = {
    nome: document.getElementById("conta_nome")?.value.trim(),
    telefone: document.getElementById("conta_telefone")?.value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/painel/minha-conta/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      msgConta(err?.detail || "Não foi possível salvar seus dados.", "erro");
      return;
    }

    msgConta("Dados atualizados com sucesso.", "ok");
  } catch (err) {
    console.error("Erro ao salvar conta:", err);
    msgConta("Erro ao salvar dados da conta.", "erro");
  }
}

async function alterarSenha() {
  const session = getSession();
  if (!session || !session.id) {
    msgSenha("Sessão inválida. Faça login novamente.", "erro");
    window.location.href = "index.html";
    return;
  }

  const senha_atual =
    document.getElementById("senha_atual")?.value.trim() || "";
  const nova_senha =
    document.getElementById("nova_senha")?.value.trim() || "";
  const confirmar_senha =
    document.getElementById("confirmar_senha")?.value.trim() || "";

  if (!senha_atual || !nova_senha || !confirmar_senha) {
    msgSenha("Preencha todos os campos de senha.", "erro");
    return;
  }

  if (nova_senha !== confirmar_senha) {
    msgSenha("A nova senha e a confirmação não conferem.", "erro");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/painel/alterar-senha/${session.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha_atual, nova_senha }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      msgSenha(err?.detail || "Não foi possível alterar a senha.", "erro");
      return;
    }

    msgSenha("Senha alterada com sucesso.", "ok");
    document.getElementById("senha_atual").value = "";
    document.getElementById("nova_senha").value = "";
    document.getElementById("confirmar_senha").value = "";
  } catch (err) {
    console.error("Erro ao alterar senha:", err);
    msgSenha("Erro ao alterar senha.", "erro");
  }
}

// ==========================
// Buscar produto (sub-página)
// ==========================
async function carregarSecaoBuscarProduto() {
  const container = document.getElementById("sec_buscar_produto_wrapper");
  if (!container) return;

  try {
    const res = await fetch("buscar_produto.html");
    if (!res.ok) {
      console.error("Não foi possível carregar a seção de busca de produto.");
      return;
    }
    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error("Erro ao carregar seção de busca de produto:", err);
  }
}

// ==========================
// Sair
// ==========================
function sair() {
  localStorage.removeItem("painel_afiliado_session");
  localStorage.removeItem("afiliado_session");
  window.location.href = "index.html";
}

// ==========================
// Proteção do painel na carga
// ==========================
async function protegerPainel() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  if (document.getElementById("nome"))
    document.getElementById("nome").textContent = session.nome || "";
  if (document.getElementById("email"))
    document.getElementById("email").textContent = session.email || "";
  if (document.getElementById("id"))
    document.getElementById("id").textContent = session.id || "";

  await carregarSecaoBuscarProduto();
  carregarSaldo(session.id);
  carregarPedidos(session.id);
  carregarMinhaConta(session.id);
}

window.addEventListener("DOMContentLoaded", protegerPainel);
