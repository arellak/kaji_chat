import { SlashCommandBuilder } from "discord.js";
import { config } from "../../../config/config.js";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

/* eslint-disable curly */

export default {
    data: new SlashCommandBuilder()
        .setName(`${config.bot.command_prefix}-stats`)
        .setDescription("Get your stats")
        .setDMPermission(false),
    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async execute(interaction){
        const user = interaction.options.get("user");
        if (user?.user?.bot) return await interaction.reply({
            content: "Bots don't have stats...",
            ephemeral: true,
        });

        // const userid = user?.user?.id || interaction.user.id;

        if (!user?.user?.id){
            return await interaction.reply("You have no stats yet...");
        }
        return await interaction.reply("You have no stats yet...");
    },
};
