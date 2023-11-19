import TelegramBot from "node-telegram-bot-api";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import {config} from "../config/config.js";
import {readJson, writeJson} from "./util/file.js";

const nlp = winkNLP(model);

const botToken = config.bot.token;
const bot = new TelegramBot(botToken, { polling: true });
console.log("Bot started...");

const isTraining = true;
const markovChain = readJson();
const lastBotMessage = {};

const getResponse = (msg) => {
    const words = nlp.readDoc(msg).tokens().out();

    const chances = Object.keys(markovChain).reduce((acc, key) => {
        const containedWords = words.filter(word => key.includes(word));
        if (containedWords.length > 0 && containedWords.length >= (words.length * config.markovChain.threshold)){
            acc[key] = (containedWords.length / words.length);
        }
        console.log(acc, key);

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

const trainNew = (msg, weighting) => {
    if(msg === undefined || msg === "") return;
    if(!markovChain[lastBotMessage[msg.author.username]]){
        markovChain[lastBotMessage[msg.author.username]] = {};
    }

    if(!markovChain[lastBotMessage[msg.author.username]][msg]){
        markovChain[lastBotMessage[msg.author.username]][msg] = 0;
    }
    markovChain[lastBotMessage[msg.author.username]][msg] += weighting;
    console.log("userMessage: " + msg + " | botMessage: " + lastBotMessage[msg.author.username]);

    for(const entry in markovChain){
        let total = 0;
        for(const nextEntry in markovChain[entry]){
            total += markovChain[entry][nextEntry];
            markovChain[entry][nextEntry] /= total;
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
    bot.sendMessage(msg.chat.id, "hey").then(message => {
        trainNew(message?.text, 1.5);
    });
});

bot.on("callback_query", (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    if(action === undefined || msg === undefined) return;

    if(action === "yes"){
        trainNew(msg?.text, 1.5);
        console.log("Good answer!");
        bot.sendMessage(msg?.chat.id, "Thanks!");
    }
    else if(action === "no"){
        trainNew(msg?.text, -1.5);
        console.log("Not a good answer...");
        bot.sendMessage(msg?.chat.id, "Sorry, I'll try to do better next time...");
    }

    console.log("===========================================");
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

    if(Object.keys(lastBotMessage).length === 0){
        lastBotMessage[msg?.from?.username] = "hey";
    }

    // trainNew(msg?.text);

    const botReply = getResponse(msg?.text);
    lastBotMessage[msg?.from?.username] = botReply;

    logConversation(msg, botReply === "" ? "Couldn't find an answer, sorry..." : botReply);
    const trainingButtons = {
        inline_keyboard: [
            [
                {
                    text: "Yes",
                    callback_data: "yes",
                },
                {
                    text: "No",
                    callback_data: "no",
                },
            ],
        ],
    };
    bot.sendMessage(msg.chat.id, botReply === "" ? "Couldn't find an answer, sorry..." : botReply, isTraining ? {
        reply_markup: trainingButtons,
    } : {});
});
