import { connectToDatabase } from "./database.js";

// Salvar a conversa no MongoDB
export async function saveChatHistory(sessionId, agentName, messages) {
  const db = await connectToDatabase();
  const collection = db.collection("chat_history");

  await collection.updateOne(
    { session_id: sessionId, actual_agent: agentName },
    { $set: { messages, actual_agent: agentName } },
    { upsert: true }
  );

  console.log(`✅ Histórico do agente '${agentName}' salvo no MongoDB!`);
}

// Carregar o histórico de um agente
export async function loadChatHistory(sessionId, agentName) {
  const db = await connectToDatabase();
  const chat = await db
    .collection("chat_history")
    .findOne({ session_id: sessionId, actual_agent: agentName });
  return chat ? chat.messages : [];
}
