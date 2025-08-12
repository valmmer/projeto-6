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

// Criar elemento para mensagem de cópia (dinâmico)
const copyMessage = document.createElement("p");
copyMessage.style.cssText = `
  display: none;
  color: #4caf50;
  font-weight: bold;
  margin-top: 5px;
  font-size: 14px;
  animation: fadeInOut 2s ease-in-out;
`;
copyMessage.textContent = "✅ Texto copiado com sucesso!";
responseSection?.appendChild(copyMessage);

// Animação CSS para fade in/out da mensagem de cópia
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);

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
    charCounter.textContent = `${perguntaInput.value.length} caracteres`;
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

  if (!apiKey) return toast("⚠️ Informe sua API key.", true);
  if (!pergunta) return toast("⚠️ Escreva uma pergunta.", true);

  if (carregando) {
    abortController?.abort();
    setCarregando(false);
  }

  adicionarMensagem(pergunta, "usuario");

  // mostra loading
  const loadingNode = adicionarMensagem("⏳ Processando…", "ia");
  setCarregando(true);

  abortController = new AbortController();

  try {
    const resposta = await perguntarOpenRouter(
      pergunta,
      abortController.signal
    );
    loadingNode.remove(); // Remove o loading quando a resposta chega
    adicionarMensagem(resposta, "ia");
    if (responseSection) responseSection.style.display = "block";
  } catch (erro) {
    if (erro.name === "AbortError") {
      // Usuário cancelou a pergunta
      loadingNode.textContent = "⚠️ Pergunta cancelada.";
    } else {
      console.error(erro);
      loadingNode.remove();
      toast("❌ Erro ao se conectar com a IA.", true);
    }
  } finally {
    setCarregando(false);
    perguntaInput.value = "";
    perguntaInput.focus();
    if (charCounter) charCounter.textContent = "0 caracteres";
  }
});

// Modal customizado para confirmar limpeza da conversa
function confirmarLimpar(mensagem) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top:0; left:0; right:0; bottom:0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #fff;
      padding: 25px 30px;
      border-radius: 12px;
      max-width: 320px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      font-family: Arial, sans-serif;
    `;

    const msg = document.createElement("p");
    msg.textContent = mensagem;
    msg.style.marginBottom = "20px";
    msg.style.fontSize = "16px";
    msg.style.color = "#333";

    const btnSim = document.createElement("button");
    btnSim.textContent = "Sim";
    btnSim.style.cssText = `
      padding: 8px 20px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      margin-right: 15px;
      font-weight: bold;
      font-size: 14px;
      transition: background-color 0.3s ease;
    `;
    btnSim.onmouseenter = () => (btnSim.style.backgroundColor = "#45a049");
    btnSim.onmouseleave = () => (btnSim.style.backgroundColor = "#4caf50");

    const btnNao = document.createElement("button");
    btnNao.textContent = "Não";
    btnNao.style.cssText = `
      padding: 8px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background-color 0.3s ease;
    `;
    btnNao.onmouseenter = () => (btnNao.style.backgroundColor = "#da190b");
    btnNao.onmouseleave = () => (btnNao.style.backgroundColor = "#f44336");

    modal.appendChild(msg);
    modal.appendChild(btnSim);
    modal.appendChild(btnNao);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    btnSim.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(true);
    });

    btnNao.addEventListener("click", () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
  });
}

clearBtn?.addEventListener("click", async () => {
  const confirmou = await confirmarLimpar(
    "Tem certeza que deseja limpar a conversa?"
  );
  if (!confirmou) return;
  perguntaInput.value = "";
  historicoConversa.innerHTML = "";
  if (charCounter) charCounter.textContent = "0 caracteres";
  if (responseSection) responseSection.style.display = "none";
  copyMessage.style.display = "none";
});

copyBtn?.addEventListener("click", async () => {
  try {
    const ultimaResposta = obterUltimaResposta();
    if (!ultimaResposta) return toast("Nada para copiar.", true);

    await navigator.clipboard.writeText(ultimaResposta);

    copyMessage.style.display = "block";
    setTimeout(() => {
      copyMessage.style.display = "none";
    }, 2000);
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
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f44336;
      color: #fff;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.3s ease;
      max-width: 90vw;
      text-align: center;
      pointer-events: none;
    `;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => (aviso.style.opacity = "1"));
    setTimeout(() => {
      aviso.style.opacity = "0";
      setTimeout(() => aviso.remove(), 300);
    }, 3000);
  } else {
    aviso.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4caf50;
      color: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.25s;
      pointer-events: none;
      max-width: 80vw;
      box-sizing: border-box;
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
  const systemMessage = "Você é um assistente virtual educado e claro.";

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
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} - ${txt || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Resposta inválida da IA.");
  return content;
}
async function exportarConversaPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const mensagens = historicoConversa.querySelectorAll(".mensagem");
  let y = 10; // posição vertical inicial

  mensagens.forEach((msg) => {
    const texto = msg.textContent;
    const linhas = doc.splitTextToSize(texto, 180); // largura da página menos margem
    doc.text(linhas, 10, y);
    y += linhas.length * 10 + 10; // aumenta posição para próxima mensagem

    if (y > 280) {
      // se passar do limite da página (A4 padrão ~297mm)
      doc.addPage();
      y = 10;
    }
  });

  doc.save("conversa.pdf");
}

// Evento do botão
document
  .getElementById("exportPdfBtn")
  .addEventListener("click", exportarConversaPDF);
