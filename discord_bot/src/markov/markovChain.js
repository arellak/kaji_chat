import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import {readJson, writeJson} from "../util/file.js";
import Log from "../util/log.js";
import {config} from "../../config/config.js";

export default class MarkovChain  {
    constructor(){
        this.lastMessage = {};
        this.markovChain = readJson();
        this.nlp = winkNLP(model);
    }

    /**
     * @memberof MarkovChain
     */
    getResponse(msg){
        const messageContent = msg.content.replace(/<@!?\d+>/g, "").trim();
        const words = this.nlp.readDoc(messageContent).tokens().out();

        const chances = Object.keys(this.markovChain).reduce((acc, key) => {
            const containedWords = words.filter(word => key.includes(word));
            if (containedWords.length > 0 && containedWords.length >= (words.length * config.markovChain.threshold)){
                acc[key] = (containedWords.length / words.length);
            }

            return acc;
        }, {});

        const keys = Object.keys(chances);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (randomKey === undefined) return messageContent;

        const answerKeys = Object.keys(this.markovChain[randomKey]);
        const randomAnswerKey = answerKeys[Math.floor(Math.random() * answerKeys.length)];

        if (randomAnswerKey === undefined) return messageContent;

        return randomAnswerKey;
    }

    train(msg){
        const messageContent = msg.content.replace(/<@!?\d+>/g, "").trim();
        if(messageContent === undefined || messageContent === "") return;
        if(!this.markovChain[this.lastMessage[msg.author.username]]){
            this.markovChain[this.lastMessage[msg.author.username]] = {};
        }

        if(!this.markovChain[this.lastMessage[msg.author.username]][messageContent]){
            this.markovChain[this.lastMessage[msg.author.username]][messageContent] = 0;
        }
        this.markovChain[this.lastMessage[msg.author.username]][messageContent]++;
        console.log(msg.author.username + ": " + messageContent + " | mukaji: " + this.lastMessage[msg.author.username]);

        for(const entry in this.markovChain){
            let total = 0;
            for(const nextEntry in this.markovChain[entry]){
                total += this.markovChain[entry][nextEntry];
                this.markovChain[entry][nextEntry] /= total;
            }
        }

        writeJson(this.markovChain);
    }

    logConversation(msg, reply){
        const messageContent = msg.content.replace(/<@!?\d+>/g, "").trim();
        Log.info(`${msg.author?.username}: ${messageContent}`);
        Log.info(`Mukaji: ${reply}`);
    }
}
