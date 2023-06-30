import TelegramBot from "node-telegram-bot-api";
import {config} from "../config/config.js";
import {readJson, writeJson} from "./util/file.js";


const botToken = config.bot.token;
const bot = new TelegramBot(botToken, { polling: true });

// const tokenSize = 4;

const markovChain = readJson();

const train = (msg) => {
  if(msg?.text === undefined || msg?.text === "") return;
  const words = msg?.text?.split(" ");
  for(let i = 0; i < words.length - 1; i++){
    if(!markovChain[words[i]]){
      markovChain[words[i]] = {};
    }

    if(!markovChain[words[i]][words[i + 1]]){
      markovChain[words[i]][words[i + 1]] = 0;
    }

    markovChain[words[i]][words[i + 1]]++;
  }

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
  let cumulativeProbability = 0.0;
  let nextState = currentState;

  for(const state in markovChain[currentState]){
    cumulativeProbability += markovChain[currentState][state];
    if(randomNumber <= cumulativeProbability){
      nextState = state;
      break;
    }
  }

  return nextState;
};

const generateReply = (startWord, length) => {
  const words = [startWord];

  for(let i = 0; i < length - 1; i++){
    const currentState = words[words.length - 1];
    const nextWord = getNextState(currentState);
    words.push(nextWord);
  }

  return words.join(" ");
};

const getFirstWord = (message) => {
  const words = message.split(" ");
  return words[0];
};

const handleNewMessage = (message) => {
  const startWord = getFirstWord(message);
  const tokenSize = Math.floor((Math.random() * 15) + 3);
  console.log(tokenSize);
  const reply = generateReply(startWord, tokenSize);

  return reply;
};


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hi! I'm a Markov Chain bot. I can generate random text based on your messages. Send me a message and I'll reply with a random message based on your message.");
});

bot.on("message", (msg) => {
  if(msg.text?.startsWith("/")) return;
  train(msg);
  const reply = handleNewMessage(msg.text);
  console.log(markovChain);
  console.log(reply);
  bot.sendMessage(msg.chat.id, reply);
});
