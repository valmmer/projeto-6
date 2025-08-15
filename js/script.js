// ================== Config & State ==================
const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
let apiKey = localStorage.getItem("apiKey") || "";
let carregando = false;
let abortController = null;

// ================== DOM Elements ==================
const perguntaInput = document.getElementById("question");
const btnPerguntar = document.getElementById("askBtn");
const historicoConversa = document.getElementById("response");
const apiKeyInput = document.getElementById("apiKey");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const charCounter = document.getElementById("charCounter");
const responseSection = document.getElementById("response-section");

// Mensagem de cópia (dinâmica)
const copyMessage = document.createElement("p");
copyMessage.style.cssText = `
  display: none;
  color: #4caf50;
  font-weight: 600;
  margin-top: 6px;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out;
`;
copyMessage.textContent = "✅ Copiado! Já está na sua área de transferência.";
responseSection?.appendChild(copyMessage);

// Animações e estilo de erro
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
  .is-invalid { outline: 2px solid #f44336; }
`;
document.head.appendChild(style);

// ================== Helpers de validação/erros ==================
function isProvavelChaveOpenRouter(key) {
  // Padrão comum: "sk-or-v{n}-..."
  return /^sk-or-v\d+-/i.test((key || "").trim());
}
function marcarApiKeyInvalida(msg = "🔑 Chave incorreta.") {
  toast(msg + " Verifique sua chave do OpenRouter (ex.: sk-or-v1-...).", true);
  if (apiKeyInput) {
    apiKeyInput.classList.add("is-invalid");
    apiKeyInput.focus();
    apiKeyInput.placeholder = "Ex.: sk-or-v1-...";
    setTimeout(() => apiKeyInput.classList.remove("is-invalid"), 2500);
  }
}

// ================== Init ==================
if (apiKeyInput) {
  apiKeyInput.value = apiKey;
  apiKeyInput.addEventListener("change", () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem("apiKey", apiKey);
  });
}

// Contador de caracteres
if (charCounter && perguntaInput) {
  perguntaInput.addEventListener("input", () => {
    charCounter.textContent = `${perguntaInput.value.length} caractere(s)`;
  });
}

// Enter para enviar (Enter sem Shift ou com Ctrl)
if (perguntaInput) {
  perguntaInput.addEventListener("keydown", (e) => {
    const isEnter = e.key === "Enter";
    if ((isEnter && !e.shiftKey) || (isEnter && e.ctrlKey)) {
      e.preventDefault();
      btnPerguntar?.click();
    }
  });
}

// ================== Eventos ==================
btnPerguntar?.addEventListener("click", async () => {
  const pergunta = (perguntaInput?.value || "").trim();

  if (!apiKey) return marcarApiKeyInvalida("🔒 Preciso da sua API key.");
  if (!isProvavelChaveOpenRouter(apiKey)) {
    return marcarApiKeyInvalida("🔑 Chave incorreta.");
  }
  if (!pergunta) return toast("📝 Escreva sua pergunta antes de enviar.", true);

  if (carregando) {
    abortController?.abort();
    setCarregando(false);
  }

  // Mensagem do usuário (guardamos referência para remover se a key for inválida)
  const userNode = adicionarMensagem(pergunta, "usuario");

  // Mostra loading
  const loadingNode = adicionarMensagem("⏳ Já estou pensando nisso…", "ia");
  setCarregando(true);
  abortController = new AbortController();

  try {
    const resposta = await perguntarOpenRouter(
      pergunta,
      abortController.signal
    );
    loadingNode.remove();
    adicionarMensagem(resposta, "ia");
    if (responseSection) responseSection.style.display = "block";
  } catch (erro) {
    if (erro.name === "AbortError") {
      loadingNode.textContent = "⚠️ Consulta cancelada.";
    } else if (
      erro.code === "INVALID_API_KEY" ||
      /invalid api key|unauthorized/i.test(erro.message)
    ) {
      userNode?.remove();
      loadingNode.remove();
      marcarApiKeyInvalida("🔑 Chave incorreta.");
    } else {
      console.error(erro);
      loadingNode.remove();
      toast(
        "❌ Não consegui me conectar agora. Tente novamente em instantes.",
        true
      );
    }
  } finally {
    setCarregando(false);
    if (perguntaInput) {
      perguntaInput.value = "";
      perguntaInput.focus();
    }
    if (charCounter) charCounter.textContent = "0 caractere(s)";
  }
});

// Modal “limpar conversa” mais gentil
function confirmarLimpar(mensagem) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 10001;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #fff;
      padding: 22px 26px;
      border-radius: 12px;
      max-width: 340px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      font-family: system-ui, Arial, sans-serif;
    `;

    const msg = document.createElement("p");
    msg.textContent = mensagem || "Limpar a conversa atual?";
    msg.style.margin = "0 0 18px";
    msg.style.fontSize = "16px";
    msg.style.color = "#222";

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "10px";
    btns.style.justifyContent = "center";

    const btnSim = document.createElement("button");
    btnSim.textContent = "Sim, pode limpar";
    btnSim.style.cssText = `
      padding: 8px 14px; background:#4caf50; color:#fff; border:none;
      border-radius: 8px; cursor:pointer; font-weight:600;
    `;

    const btnNao = document.createElement("button");
    btnNao.textContent = "Cancelar";
    btnNao.style.cssText = `
      padding: 8px 14px; background:#eee; color:#333; border:none;
      border-radius: 8px; cursor:pointer; font-weight:600;
    `;

    btns.appendChild(btnSim);
    btns.appendChild(btnNao);
    modal.appendChild(msg);
    modal.appendChild(btns);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    btnSim.addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    btnNao.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
  });
}

clearBtn?.addEventListener("click", async () => {
  const confirmou = await confirmarLimpar(
    "Quer mesmo começar do zero? A conversa atual será apagada."
  );
  if (!confirmou) return;
  if (perguntaInput) perguntaInput.value = "";
  if (historicoConversa) historicoConversa.innerHTML = "";
  if (charCounter) charCounter.textContent = "0 caractere(s)";
  if (responseSection) responseSection.style.display = "none";
  copyMessage.style.display = "none";
  toast("🧹 Conversa limpa. Podemos recomeçar!", false);
});

copyBtn?.addEventListener("click", async () => {
  try {
    const ultimaResposta = obterUltimaResposta();
    if (!ultimaResposta) return toast("Nada para copiar por aqui ainda.", true);

    await navigator.clipboard.writeText(ultimaResposta);
    copyMessage.style.display = "block";
    setTimeout(() => (copyMessage.style.display = "none"), 2000);
  } catch (err) {
    console.error("Erro ao copiar:", err);
    toast("❌ Não consegui copiar. Use HTTPS ou localhost.", true);
  }
});

// ================== Helpers ==================
function setCarregando(flag) {
  carregando = flag;
  if (btnPerguntar) {
    btnPerguntar.disabled = flag;
    btnPerguntar.textContent = flag ? "Enviando…" : "Perguntar";
  }
}

function adicionarMensagem(texto, tipo) {
  const div = document.createElement("div");
  div.classList.add(
    "mensagem",
    tipo === "usuario" ? "pergunta-usuario" : "resposta-ia"
  );
  div.textContent = texto;
  historicoConversa?.appendChild(div);
  if (historicoConversa)
    historicoConversa.scrollTop = historicoConversa.scrollHeight;
  return div;
}

function obterUltimaResposta() {
  const respostas = historicoConversa?.querySelectorAll(".resposta-ia");
  if (!respostas || respostas.length === 0) return "";
  return respostas[respostas.length - 1].textContent.trim();
}

function toast(texto, erro = false) {
  const aviso = document.createElement("div");
  aviso.textContent = texto;

  if (erro) {
    aviso.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #f44336; color: #fff; padding: 18px 26px; border-radius: 12px;
      font-size: 16px; font-weight: 700; z-index: 10000; box-shadow: 0 6px 24px rgba(0,0,0,0.28);
      opacity: 0; transition: opacity .25s ease; max-width: 90vw; text-align: center; pointer-events: none;
    `;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => (aviso.style.opacity = "1"));
    setTimeout(() => {
      aviso.style.opacity = "0";
      setTimeout(() => aviso.remove(), 250);
    }, 2600);
  } else {
    aviso.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: #4caf50; color: #fff; padding: 10px 14px; border-radius: 10px;
      font-size: 14px; z-index: 9999; opacity: 0; transition: opacity .25s; pointer-events: none;
      max-width: 80vw; box-sizing: border-box;
    `;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => (aviso.style.opacity = "1"));
    setTimeout(() => {
      aviso.style.opacity = "0";
      setTimeout(() => aviso.remove(), 250);
    }, 2000);
  }
}

// ================== API ==================
async function perguntarOpenRouter(pergunta, signal) {
  const systemMessage =
    "Você é um assistente virtual educado, objetivo e gentil.";

  const resp = await fetch(URL_OPENROUTER, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: pergunta },
      ],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    // extrair mensagem do corpo (JSON/Texto) e classificar
    let bodyText = "";
    try {
      bodyText = await resp.text();
    } catch (e) {}
    const lower = (bodyText || resp.statusText || "").toLowerCase();

    if (
      resp.status === 401 ||
      resp.status === 403 ||
      lower.includes("invalid api key") ||
      lower.includes("unauthorized")
    ) {
      const err = new Error("INVALID_API_KEY");
      err.code = "INVALID_API_KEY";
      throw err;
    }

    const err = new Error(
      `HTTP ${resp.status} - ${bodyText || resp.statusText}`
    );
    err.code = "HTTP_ERROR";
    throw err;
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Resposta inválida da IA.");
  return content;
}

// ================== Exportar PDF ==================
async function exportarConversaPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const mensagens = historicoConversa.querySelectorAll(".mensagem");
  let y = 10;

  mensagens.forEach((msg) => {
    const texto = msg.textContent;
    const linhas = doc.splitTextToSize(texto, 180);
    doc.text(linhas, 10, y);
    y += linhas.length * 10 + 10;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("conversa.pdf");
}

// Evento do botão PDF
document
  .getElementById("exportPdfBtn")
  ?.addEventListener("click", exportarConversaPDF);
