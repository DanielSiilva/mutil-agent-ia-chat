import readlineSync from "readline-sync";
import axios from "axios";
import dotenv from "dotenv";
import { menuOptions } from "./menu-options.js";
import { agents } from "./agents.js";
import {
  loadChatHistory,
  saveChatHistory,
  saveGeneralChatHistory,
} from "./chat-history.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Função para chamar a IA e garantir que o agente esteja correto
async function askChatGPT(agentName, userMessage, isFirstInteraction = false) {
  const chatHistory = loadChatHistory(agentName);

  // Pega o prompt correto do agente
  const systemPrompt = agents[agentName] || "Você é um assistente virtual.";

  // Se for a primeira interação, usa o prompt normal, senão, mantém o fluxo
  let promptMessage = isFirstInteraction
    ? systemPrompt
    : `${systemPrompt} Continue a conversa com base no contexto. Não use saudações iniciais.`;

  console.log(`\n🔍 Executando agente: ${agentName}`); // Log do agente atual

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptMessage },
          ...chatHistory.messages.map((msg) => ({
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

    let responseMessage = response.data.choices[0].message.content.trim();
    let actualAgent = agentName;

    // Atualizar histórico do agente
    chatHistory.actual_agent = actualAgent;
    chatHistory.messages.push({ from: "user", message: userMessage });
    chatHistory.messages.push({ from: "ia", message: responseMessage });

    // Salvar histórico do agente
    saveChatHistory(agentName, chatHistory);

    // Salvar histórico geral
    saveGeneralChatHistory(userMessage, responseMessage, actualAgent);

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

// Gerenciar a resposta inicial da IA e exibir o menu
async function handleInitialMessage(input) {
  let { responseMessage } = await askChatGPT("welcome", input, true);
  console.log(`\n🤖 IA: ${responseMessage}`);
  showMenu();

  let menuInput = readlineSync.question("\nEscolha uma opção: ").trim();
  await handleMenuSelection(menuInput);
}

// Gerenciar escolha do menu e ativar o agente correspondente
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

// Ativar um agente específico quando o usuário escolhe no menu
async function activateAgent(agentName) {
  console.log(`\n🚀 Ativando agente: ${agentName}`); // Log de ativação do agente

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

// Iniciar o chatbot no terminal
startChat();
