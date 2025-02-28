import fs from "fs";
import path from "path";

const chatHistoryDir = path.resolve("chat-history");

// Certifique-se de que o diretório de histórico existe
if (!fs.existsSync(chatHistoryDir)) {
  fs.mkdirSync(chatHistoryDir, { recursive: true });
}

// Função para carregar o histórico de um agente específico
export function loadChatHistory(agentName) {
  const filePath = path.join(chatHistoryDir, `chat-history_${agentName}.json`);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error(`Erro ao carregar histórico do agente ${agentName}:`, error);
  }
  return {
    session_id: `session_${Date.now()}`,
    messages: [],
    actual_agent: agentName,
  };
}

// Função para salvar o histórico de um agente específico
export function saveChatHistory(agentName, chatHistory) {
  const filePath = path.join(chatHistoryDir, `chat-history_${agentName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error(`Erro ao salvar histórico do agente ${agentName}:`, error);
  }
}

// Função para salvar o histórico geral de todas as conversas
export function saveGeneralChatHistory(
  userMessage,
  responseMessage,
  actualAgent
) {
  const filePath = path.join(chatHistoryDir, "chat-history-general.json");

  let generalChatHistory = { messages: [] };

  try {
    if (fs.existsSync(filePath)) {
      generalChatHistory = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error("Erro ao carregar histórico geral:", error);
  }

  // Adicionar a nova interação ao histórico geral
  generalChatHistory.messages.push({
    actual_agent: actualAgent,
    from: "user",
    message: userMessage,
  });

  generalChatHistory.messages.push({
    actual_agent: actualAgent,
    from: "ia",
    message: responseMessage,
  });

  try {
    fs.writeFileSync(filePath, JSON.stringify(generalChatHistory, null, 2));
  } catch (error) {
    console.error("Erro ao salvar histórico geral:", error);
  }
}
