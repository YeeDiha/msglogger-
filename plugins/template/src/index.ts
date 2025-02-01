import { definePlugin } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { Message } from "discord.js";
import { promises as fs } from "fs";
import path from "path";

interface MessageLog {
  id: string;
  content: string;
  author: string;
  channelId: string;
  channelName: string;
  guildId?: string;
  guildName?: string;
  timestamp: Date;
}

const logFilePath = path.join(__dirname, "messageLogs.json");

// Функция для загрузки логов из файла
async function loadLogs(): Promise<MessageLog[]> {
  try {
    const data = await fs.readFile(logFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Функция для сохранения логов в файл
async function saveLogs(logs: MessageLog[]) {
  await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
}

export default definePlugin({
  id: "MessageLoggerV3",
  name: "Message Logger V3",
  version: "1.0.0",
  description: "A plugin to log deleted messages in DMs and server channels.",
  author: "YourName",
  license: "MIT",

  async onStart() {
    console.log("Message Logger V3 started!");
    // Загружаем логи при старте плагина
    const logs = await loadLogs();
    storage.setItem("messageLogs", logs);
  },

  onStop() {
    console.log("Message Logger V3 stopped!");
  },

  async onMessageCreate(message: Message) {
    const logs = await loadLogs();
    const log: MessageLog = {
      id: message.id,
      content: message.content,
      author: message.author.username,
      channelId: message.channel.id,
      channelName: message.channel.type === "DM" ? "DM" : message.channel.name,
      guildId: message.guild?.id,
      guildName: message.guild?.name,
      timestamp: new Date(),
    };
    logs.push(log);
    await saveLogs(logs);
  },

  async onMessageDelete(message: Message) {
    const logs = await loadLogs();
    const index = logs.findIndex((log) => log.id === message.id);
    if (index !== -1) {
      logs.splice(index, 1);
      await saveLogs(logs);
    }
  },

  async onMessageUpdate(oldMessage: Message, newMessage: Message) {
    const logs = await loadLogs();
    const index = logs.findIndex((log) => log.id === oldMessage.id);
    if (index !== -1) {
      logs[index].content = newMessage.content;
      await saveLogs(logs);
    }
  },
});
