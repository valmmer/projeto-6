// ================== Config & State ==================
const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
let apiKey = localStorage.getItem("apiKey") || "";
let carregando = false;

// ================== DOM Elements ==================
const perguntaInput = document.getElementById("question");
const btnPerguntar = document.getElementById("askBtn");
const historicoConversa = document.getElementById("response");
const apiKeyInput = document.getElementById("apiKey");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const responseSection = document.getElementById("response-section"); // certifique-se que existe no HTML

// ================== Init ==================
if (apiKeyInput) {
  apiKeyInput.value = apiKey;
  apiKeyInput.addEventListener("change", () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem("apiKey", apiKey);
  });
}

// Enter para enviar (Enter envia, Shift+Enter quebra linha; Ctrl+Enter também envia)
if (perguntaInput) {
  perguntaInput.addEventListener("keydown", (e) => {
    const isEnter = e.key === "Enter";
    if ((isEnter && !e.shiftKey) || (isEnter && e.ctrlKey)) {
      e.preventDefault();
      btnPerguntar?.click();
    }
  });
}

// Clique no botão perguntar
btnPerguntar?.addEventListener("click", async () => {
  const pergunta = (perguntaInput?.value || "").trim();
  if (!apiKey) return toast("⚠️ Informe sua API key.", true);
  if (!pergunta) return; // não envia vazio
  if (carregando) return; // evita envios paralelos

  adicionarMensagem(pergunta, "usuario");

  // mostra loading
  const loadingNode = adicionarMensagem("⏳ Processando…", "ia");
  setCarregando(true);

  try {
    const resposta = await perguntarOpenRouter(pergunta);
    loadingNode.remove();
    adicionarMensagem(resposta, "ia");
    if (responseSection) responseSection.style.display = "block";
  } catch (erro) {
    console.error(erro);
    loadingNode.textContent = "❌ Erro ao se conectar com a IA.";
  } finally {
    setCarregando(false);
    if (perguntaInput) {
      perguntaInput.value = "";
      perguntaInput.focus();
    }
  }
});

// Limpar conversa
clearBtn?.addEventListener("click", () => {
  if (perguntaInput) perguntaInput.value = "";
  if (historicoConversa) historicoConversa.innerHTML = "";
  if (responseSection) responseSection.style.display = "none";
});

// Copiar última resposta
copyBtn?.addEventListener("click", async () => {
  try {
    const ultima = obterUltimaResposta();
    if (!ultima) return toast("Nada para copiar.", true);

    await navigator.clipboard.writeText(ultima);
    toast("✅ Resposta copiada!");
  } catch (err) {
    console.error("Erro ao copiar:", err);
    toast("❌ Não foi possível copiar. Use HTTPS/localhost.", true);
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
  return div; // retorno para permitir remover/atualizar (loading)
}

function obterUltimaResposta() {
  const respostas = historicoConversa?.querySelectorAll(".resposta-ia");
  if (!respostas || respostas.length === 0) return "";
  return respostas[respostas.length - 1].textContent.trim();
}

function toast(texto, erro = false) {
  const aviso = document.createElement("div");
  aviso.textContent = texto;
  aviso.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: ${erro ? "#f44336" : "#4caf50"};
    color: #fff; padding: 8px 12px; border-radius: 6px;
    font-size: 14px; z-index: 9999; opacity: 0; transition: opacity .25s;
  `;
  document.body.appendChild(aviso);
  requestAnimationFrame(() => (aviso.style.opacity = "1"));
  setTimeout(() => {
    aviso.style.opacity = "0";
    setTimeout(() => aviso.remove(), 250);
  }, 2000);
}

// ================== API ==================
async function perguntarOpenRouter(pergunta) {
  const systemMessage = "Você é um assistente virtual educado e claro.";

  const resp = await fetch(URL_OPENROUTER, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo", // troque por um modelo mais novo se quiser
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: pergunta },
      ],
      temperature: 0.2,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${txt || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Resposta inválida da IA.");
  return content;
}
// ================================================== fim script.js ==================================================