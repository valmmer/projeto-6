const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
let apiKey = localStorage.getItem("apiKey") || "";

// Elementos da interface
const perguntaInput = document.getElementById("question");
const btnPerguntar = document.getElementById("askBtn");
const historicoConversa = document.getElementById("response");
const apiKeyInput = document.getElementById("apiKey");
const responseSection = document.getElementById("response-section");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

// Carregar API Key salva
apiKeyInput.value = apiKey;

// Atualizar localStorage ao digitar nova API Key
apiKeyInput.addEventListener("change", () => {
  apiKey = apiKeyInput.value;
  localStorage.setItem("apiKey", apiKey);
});

// Botão perguntar
btnPerguntar.addEventListener("click", async () => {
  const pergunta = perguntaInput.value.trim();
  apiKey = apiKeyInput.value.trim();

  // Validação
  if (!apiKey || !pergunta) {
    alert("⚠️ Preencha a API Key e a pergunta.");
    return;
  }

  adicionarMensagem(pergunta, "usuario");

  // Exibir área de resposta e mensagem de carregamento
  responseSection.style.display = "block";
  adicionarMensagem("⏳ Processando...", "ia");

  try {
    const resposta = await perguntarOpenRouter(pergunta);
    removerMensagemDeCarregamento();
    adicionarMensagem(resposta, "ia");
  } catch (erro) {
    removerMensagemDeCarregamento();
    adicionarMensagem("❌ Erro ao se conectar com a IA.", "ia");
    console.error(erro);
  }

  perguntaInput.value = "";
});

// Enviar pergunta à OpenRouter
async function perguntarOpenRouter(pergunta) {
  const systemMessage = "Você é um assistente virtual educado e claro.";

  const response = await fetch(URL_OPENROUTER, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: pergunta },
      ],
    }),
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error("Resposta inválida da IA");
  }

  return data.choices[0].message.content;
}

// Mostrar mensagens na tela
function adicionarMensagem(texto, tipo) {
  const mensagemDiv = document.createElement("div");
  mensagemDiv.classList.add(
    "mensagem",
    tipo === "usuario" ? "pergunta-usuario" : "resposta-ia"
  );
  mensagemDiv.textContent = texto;
  historicoConversa.appendChild(mensagemDiv);
  historicoConversa.scrollTop = historicoConversa.scrollHeight;
}

// Remover mensagem de carregando
function removerMensagemDeCarregamento() {
  const mensagens = historicoConversa.querySelectorAll(".resposta-ia");
  mensagens.forEach((m) => {
    if (m.textContent.includes("Processando")) {
      m.remove();
    }
  });
}

// Copiar resposta
copyBtn.addEventListener("click", () => {
  const textos = Array.from(
    historicoConversa.querySelectorAll(".resposta-ia")
  ).map((div) => div.textContent);
  const ultimaResposta = textos[textos.length - 1];
  if (!ultimaResposta) return;

  navigator.clipboard.writeText(ultimaResposta).then(() => {
    alert("✅ Resposta copiada!");
  });
});

// Limpar campos
clearBtn.addEventListener("click", () => {
  perguntaInput.value = "";
  historicoConversa.innerHTML = "";
  responseSection.style.display = "none";
});

// Ctrl + Enter para enviar
perguntaInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    btnPerguntar.click();
  }
});
