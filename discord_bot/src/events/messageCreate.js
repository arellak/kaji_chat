import Log from "../util/log.js";
import { config } from "../../config/config.js";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

/**
 * Handle messageCreate event
 *
 * @param {import("discord.js").Message} message
 * @return {Promise<void>}
 */
const messageCreate = async function(message, markovChain){
    if(message.author.bot) return;
    if(!message.mentions.has(config.bot.client_id)){
        return;
    }

    if (!message.guild){
        return;
    }

    const guild = message.guild?.id;
    const user = message.author.id;

    if (!guild || !user){
        Log.error("Could not get guild or user id", new Error());
        return;
    }

    if(Object.keys(markovChain.lastMessage).length === 0){
        markovChain.lastMessage[message.author.username] = "hey";
    }

    const botReply = markovChain.getResponse(message);

    markovChain.lastMessage[message.author.username] = botReply;
    markovChain.train(message);

    await message.reply(botReply);
};

export default messageCreate;
