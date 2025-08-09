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

//IMPLEMENTAÇÃO DO BOTÃO DE LIMPAR RESPOSTA ------------------------

//chamo o id do elemento que vou manipular
const clearButton = document.getElementById("clearBtn");  

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

//função que vai ser executada ao clicar no botão "Limpar Resposta"
function apagarResposta (){
  historicoConversa.innerHTML = '';
  console.log ("Resposta limpa!");
};

clearButton.addEventListener("click", apagarResposta);

//IMPLEMENTAÇÃO DO BOTÃO DE COPIAR RESPOSTA ------------------------

const copyBtn = document.getElementById("copyBtn");

copyBtn.addEventListener("click",() => {
  const textos= Array.from (
    historicoConversa.querySelectorAll(".resposta-ia")
  ).map ((div) => div.textContent);
  const ultimaResposta= textos [textos.length -1];
  if (!ultimaResposta)
    {console.log ("Não foi possível copiar a conversa.")}; 

  navigator.clipboard.writeText(ultimaResposta).then(() => {
    alert ("✅ Resposta copiada!");
  }); return;
});

//IMPLEMENTAÇÃO DA TECLA 'ENTER' PARA ENVIO DA RESPOSTA

const enviar = document.getElementById ("question")

enviar.addEventListener("keydown", (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();                // Evita quebra de linha
    askBtn.click();                   // Simula clique no botão
  console.log ("Mensagem enviada.")};
});

