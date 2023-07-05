import TelegramBot from "node-telegram-bot-api";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import {config} from "../config/config.js";
import {readJson, writeJson} from "./util/file.js";

const nlp = winkNLP(model);

const botToken = config.bot.token;
const bot = new TelegramBot(botToken, { polling: true });

const markovChain = readJson();
let lastBotMessage;

const getResponseByWord = (msg) => {
  const words = nlp.readDoc(msg).tokens().out();

  const chances = Object.keys(markovChain).reduce((acc, key) => {
    const containedWords = words.filter(word => key.includes(word));
    if (containedWords.length > 0 && containedWords.length >= (words.length * config.markovChain.threshold)){
      acc[key] = (containedWords.length / words.length);
    }
    return acc;
  }, {});

  const keys = Object.keys(chances);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  if (randomKey === undefined) return msg;

  const answersKeys = Object.keys(markovChain[randomKey]);
  const randomAnswerKey = answersKeys[Math.floor(Math.random() * answersKeys.length)];

  if (randomAnswerKey === undefined) return msg;

  return randomAnswerKey;
};

const trainNew = (msg) => {
  if(msg === undefined || msg === "") return;
  if(!markovChain[lastBotMessage]){
    markovChain[lastBotMessage] = {};
  }

  if(!markovChain[lastBotMessage][msg]){
    markovChain[lastBotMessage][msg] = 0;
  }
  markovChain[lastBotMessage][msg]++;

  for(const word in markovChain){
    let total = 0;
    for(const nextWord in markovChain[word]){
      total += markovChain[word][nextWord];
    }
    for(const nextWord in markovChain[word]){
      markovChain[word][nextWord] /= total;
    }
  }
  writeJson(markovChain);
};

const logConversation = (msg, reply) => {
  if(msg.from?.username === undefined){
    console.log(`${msg.from?.first_name}: ${msg.sticker ? msg.sticker.emoji : msg.text}`);
  }
  else{
    console.log(`${msg.from?.username}: ${msg.sticker ? msg.sticker.emoji : msg.text}`);
  }
  console.log(`Mukaji: ${reply}`);
};

// bot.onText(/\/stats/, (msg) => {});

bot.onText(/\/start/, (msg) => {
  // eslint-disable-next-line no-return-assign
  bot.sendMessage(msg.chat.id, "Hey").then(message => {
    lastBotMessage = message?.text;
    trainNew("Hey");
  });
});

bot.on("message", (msg) => {
  if(Object.keys(markovChain).length === 0 && msg.text !== "/start"){
    bot.sendMessage(msg.chat.id, "Please start with /start");
    return;
  }

  console.log("===========================================");
  if(msg.text?.startsWith("/")) return;
  if(msg.audio || msg.video || msg.photo || msg.document){
    bot.sendMessage(msg.chat.id, "Sorry, I can't handle media...");
    console.log("media found, skipping...");
    console.log("===========================================");
    return;
  }

  if(lastBotMessage === undefined){
    lastBotMessage = "hey";
  }
  trainNew(msg?.text);
  const reply = getResponseByWord(msg?.text);
  lastBotMessage = reply;
  logConversation(msg, reply === "" ? "Couldn't find an answer, sorry..." : reply);
  bot.sendMessage(msg.chat.id, reply === "" ? "Couldn't find an answer, sorry..." : reply);
  console.log("===========================================");
});
