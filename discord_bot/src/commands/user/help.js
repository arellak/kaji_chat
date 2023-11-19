import { SlashCommandBuilder } from "discord.js";
import { config } from "../../../config/config.js";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

export default {
    data: new SlashCommandBuilder()
        .setName(`${config.bot.command_prefix}-help`)
        .setDescription("List all commands")
        .setDMPermission(false),
    /**
     * @param {import("discord.js").CommandInteraction} interaction
     */
    async execute(interaction){
        const userCommands = /** @type {import("../../service/client.js").default} */ (interaction.client)
            .commands.filter(cmd => !cmd.data.default_member_permissions);

        const str = await Promise.all(userCommands.map(async(cmd) => {
            const desc = cmd.data.description;
            return `**/${cmd.data.name}** - ${desc}`;
        }));

        return await interaction.reply({
            content: str.join("\n"),
            ephemeral: true,
        });
    },
};
