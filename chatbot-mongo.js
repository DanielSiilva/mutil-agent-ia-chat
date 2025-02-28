import readlineSync from "readline-sync";
import axios from "axios";
import dotenv from "dotenv";
import { menuOptions } from "./menu-options.js";
import {
  getAgentPrompt,
  connectToDatabase,
  populateAgents,
} from "./database.js";
import { loadChatHistory, saveChatHistory } from "./chat-history-new.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let sessionId = `session_${Date.now()}`; // Criar um ID único para a sessão

// Função para chamar a IA
async function askChatGPT(agentName, userMessage, isFirstInteraction = false) {
  const systemPrompt = await getAgentPrompt(agentName);
  const chatHistory = await loadChatHistory(sessionId, agentName);

  let promptMessage = isFirstInteraction
    ? systemPrompt
    : `${systemPrompt} Continue a conversa com base no contexto. Não use saudações iniciais.`;

  console.log(`\n🔍 Executando agente: ${agentName}`);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptMessage },
          ...chatHistory.map((msg) => ({
            role: msg.from === "user" ? "user" : "assistant",
            content: msg.message,
          })),
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error("Resposta inválida da OpenAI");
    }

    let responseMessage = response.data.choices[0].message.content.trim();
    let actualAgent = agentName;

    // Atualizar histórico no MongoDB
    const updatedMessages = [
      ...chatHistory,
      { from: "user", message: userMessage },
      { from: "ia", message: responseMessage },
    ];
    await saveChatHistory(sessionId, actualAgent, updatedMessages);

    return { responseMessage, actualAgent };
  } catch (error) {
    console.error(
      `Erro ao chamar OpenAI para o agente ${agentName}:`,
      error.response?.data || error.message
    );
    return {
      responseMessage:
        "Desculpe, ocorreu um erro ao processar sua solicitação.",
      actualAgent: agentName,
    };
  }
}

// Exibir menu de opções
function showMenu() {
  console.log("\n🤖 Aqui estão algumas opções para te ajudar:");
  Object.keys(menuOptions).forEach((key) => {
    console.log(`${key}. ${menuOptions[key]}`);
  });
}

// Início do chat
async function startChat() {
  await connectToDatabase();
  await populateAgents();
  console.log('🛒 Bem-vindo ao suporte! Digite "sair" para encerrar.');

  while (true) {
    let userInput = readlineSync.question("\nVocê: ").trim().toLowerCase();

    if (userInput === "sair") {
      console.log("🤖 Chat encerrado. Até mais!");
      break;
    }

    await handleInitialMessage(userInput);
  }
}

// Gerenciar resposta inicial
async function handleInitialMessage(input) {
  let { responseMessage } = await askChatGPT("welcome", input, true);
  console.log(`\n🤖 IA: ${responseMessage}`);
  showMenu();

  let menuInput = readlineSync.question("\nEscolha uma opção: ").trim();
  await handleMenuSelection(menuInput);
}

// Gerenciar menu
async function handleMenuSelection(input) {
  if (input === "1") {
    await activateAgent("change_product");
    return;
  }
  if (input === "2") {
    await activateAgent("speak_with_attendant");
    return;
  }

  console.log("\n🤖 Bot: Opção inválida. Escolha um número válido.");
  let newInput = readlineSync.question("\nEscolha uma opção válida: ").trim();
  await handleMenuSelection(newInput);
}

// Ativar agente
async function activateAgent(agentName) {
  console.log(`\n🚀 Ativando agente: ${agentName}`);

  let { responseMessage } = await askChatGPT(
    agentName,
    "Seguindo o atendimento. Qual é o próximo passo?",
    false
  );
  console.log(`\n🤖 IA: ${responseMessage}`);

  while (true) {
    let userInput = readlineSync.question("\nVocê: ").trim().toLowerCase();
    if (userInput === "sair") {
      console.log("🤖 Chat encerrado. Até mais!");
      break;
    }

    let { responseMessage } = await askChatGPT(agentName, userInput, false);
    console.log(`\n🤖 IA: ${responseMessage}`);
  }
}

// Iniciar o chatbot
startChat();
