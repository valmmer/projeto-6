// === CONFIGURAÇÕES DA API ===
const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
let apiKey = localStorage.getItem("apiKey") || "";

// === ELEMENTOS ESSENCIAIS DA INTERFACE ===
const perguntaInput = document.getElementById("pergunta");
const btnPerguntar = document.getElementById("btn-perguntar");
const historicoConversa = document.getElementById("historico-conversa");

// === ENVIA A PERGUNTA PARA A API ===
btnPerguntar.addEventListener("click", async () => {
  const pergunta = perguntaInput.value.trim();
  if (!apiKey || !pergunta) return;

  adicionarMensagem(pergunta, "usuario");

  try {
    const resposta = await perguntarOpenRouter(pergunta);
    adicionarMensagem(resposta, "ia");
  } catch (erro) {
    adicionarMensagem("Erro ao se conectar com a IA.", "ia");
    console.error(erro);
  }

  perguntaInput.value = "";
});

// === FUNÇÃO QUE FAZ A CHAMADA À OPENROUTER ===
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

// === ADICIONA MENSAGEM NO HISTÓRICO ===
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

