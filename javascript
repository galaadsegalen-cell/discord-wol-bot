const { Client, GatewayIntentBits } = require('discord.js');
const wol = require('wake_on_lan');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MAC_ADDRESS = 'd0:27:88:56:54:cd';
const BROADCAST_IP = '100.110.183.115';

client.on('ready', () => {
  console.log(`Bot d'allumage prêt : ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton() || interaction.customId !== 'wake_pc') return;

  wol.wake(MAC_ADDRESS, { address: BROADCAST_IP }, (error) => {
    if (error) {
      interaction.reply({ content: "❌ Erreur lors de l'envoi du signal.", ephemeral: true });
    } else {
      interaction.reply({ content: "⚡ Signal envoyé ! Le PC et le serveur Minecraft s'allument..." });
    }
  });
});

client.login(process.env.DISCORD_TOKEN);
