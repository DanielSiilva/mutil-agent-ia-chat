import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "chatbot_db";

let client;
let db;

// Conectar ao MongoDB
export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("✅ Conectado ao MongoDB!");
  }
  return db;
}

// Popular a tabela de agentes, se ainda não existirem
export async function populateAgents() {
  const db = await connectToDatabase();
  const collection = db.collection("agents");

  const existingAgents = await collection.countDocuments();
  if (existingAgents === 0) {
    await collection.insertMany([
      {
        _id: "welcome",
        prompt:
          "Oi, seja bem-vindo ao atendimento virtual. Como posso te ajudar?",
      },
      {
        _id: "change_product",
        prompt:
          "O cliente quer trocar um produto. Pergunte pelo número do pedido.",
      },
      {
        _id: "speak_with_attendant",
        prompt:
          "O cliente quer falar com um atendente humano. Explique o tempo de espera.",
      },
    ]);
    console.log("✅ Agentes populados no MongoDB!");
  }
}

// Buscar um agente do banco de dados
export async function getAgentPrompt(agentName) {
  const db = await connectToDatabase();
  const agent = await db.collection("agents").findOne({ _id: agentName });
  return agent ? agent.prompt : "Você é um assistente virtual.";
}
