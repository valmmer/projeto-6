const URL_OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
let apiKey = localStorage.getItem("apiKey") || "";

// Elementos da interface
const perguntaInput = document.getElementById("question");
const btnPerguntar = document.getElementById("askBtn");
const historicoConversa = document.getElementById("response");
const apiKeyInput = document.getElementById("apiKey");

// Salvar API key
apiKeyInput.value = apiKey;
apiKeyInput.addEventListener("change", () => {
  apiKey = apiKeyInput.value;
  localStorage.setItem("apiKey", apiKey);
});

// Botão perguntar
btnPerguntar.addEventListener("click", async () => {
  const pergunta = perguntaInput.value.trim();
  if (!apiKey || !pergunta) return;

  adicionarMensagem(pergunta, "usuario");

  try {
    const resposta = await perguntarOpenRouter(pergunta);
    adicionarMensagem(resposta, "ia");
    document.getElementById("response-section").style.display = "block";
  } catch (erro) {
    adicionarMensagem("Erro ao se conectar com a IA.", "ia");
    console.error(erro);
  }

  perguntaInput.value = "";
});

// Enviar pergunta à API
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

// Mostrar mensagens
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
