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

const getNextState = (currentState) => {
  const randomNumber = Math.random();
  let probability = 0.0;
  let nextState = currentState;
  const maxAttempts = 5;
  let attempts = 0;

  while (attempts < maxAttempts) {
    for(const state in markovChain[currentState]){
      probability += markovChain[currentState][state];
      if(randomNumber <= probability){
        nextState = state;
        break;
      }
    }
    if (nextState !== currentState) {
      break;
    }
    attempts++;
  }

  if (attempts === maxAttempts) {
    nextState = "I'm not sure what to say.";
  }

  return nextState;
};

const generateReply = (startWord) => {
  const response = getNextState(startWord);
  if(startWord === response) return startWord;

  return response;
};

const handleNewMessage = (msg) => {
  const startWord = msg.sticker ? msg.sticker?.emoji : nlp.readDoc(msg.text).sentences().out()[0];

  return generateReply(startWord);
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

bot.onText(/\/start/, (msg) => {
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
  trainNew(msg.text);

  const reply = handleNewMessage(msg);
  lastBotMessage = reply;
  logConversation(msg, reply === "" ? "Couldn't find an answer, sorry..." : reply);
  bot.sendMessage(msg.chat.id, reply === "" ? "Couldn't find an answer, sorry..." : reply);
  console.log("===========================================");
});

