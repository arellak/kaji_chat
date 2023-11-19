import Log from "../util/log.js";

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

/**
 * Handle command Interaction events
 *
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 * @return {Promise<void>}
 */
const handleCommandInteraction = async function(interaction){
    const command = /** @type {import("../service/client.js").default} */ (interaction.client)
        .commands.get(interaction.commandName);

    if (!command){
        Log.warn(`No command matching ${interaction.commandName} was found.`);
        await interaction.reply({ content: "Command not found...", ephemeral: true });
        return;
    }

    try {
        await command.execute(interaction);
    }
    catch (error){
        Log.error("Error during command execution: ", error);
        if (interaction.replied || interaction.deferred){
            await interaction.followUp({ content: "Exectuon failed...", ephemeral: true });
        }
        else {
            await interaction.reply({ content: "Execution failed...", ephemeral: true });
        }
    }
};

/**
 * Handle select menu Interaction events
 *
 * @param {import("discord.js").StringSelectMenuInteraction} interaction
 * @return {Promise<any>}
 */
const handleSelectMenuInteraction = async function(interaction){
    let target = interaction.message.interaction?.user.id;
    if (!target){
        const message = await interaction.channel?.messages.fetch(String(interaction.message.reference?.messageId ?? ""));
        target = message?.interaction?.user.id;
    }

    if (interaction.user.id !== target){
        return await interaction.reply({
            content: "Interaction is not yours...",
            ephemeral: true,
        });
    }

    return Log.warn(`No select menu matching ${interaction.customId} was found.`);
};

/**
 * Handle button Interaction events
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @return {Promise<any>}
 */
const handleButtonInteraction = async function(interaction){
    if (interaction.customId === "yes" || interaction.customId === "no") return null;
    return Log.warn(`No button matching ${interaction.customId} was found.`);
};

/**
 * Handle interactionCreate event
 *
 * @param {import("discord.js").Interaction} interaction
 * @return {Promise<void>}
 */
const interactionCreateHandler = async function(interaction){
    if (interaction.isStringSelectMenu()) await handleSelectMenuInteraction(interaction);
    if (interaction.isChatInputCommand()) await handleCommandInteraction(interaction);
    if (interaction.isButton()) await handleButtonInteraction(interaction);
};

export default interactionCreateHandler;
