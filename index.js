const { Client, GatewayIntentBits } = require('discord.js');
const wol = require('wake_on_lan');
const http = require('http');

// Serveur Web minimaliste pour maintenir le service actif sur Render
http.createServer((req, res) => {
  res.write("Bot Discord WOL opérationnel !");
  res.end();
}).listen(process.env.PORT || 10000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MAC_ADDRESS = 'd0:27:88:56:54:cd';
const BROADCAST_IP = '100.110.183.115';

client.on('ready', () => {
  console.log(`Bot d'allumage prêt : ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  // On répond UNIQUEMENT si l'action concerne l'allumage
  if (id === 'wake_pc' || id === 'start_mc' || id.includes('start') || id.includes('wake')) {
    await interaction.deferReply({ ephemeral: true });

    wol.wake(MAC_ADDRESS, { address: BROADCAST_IP }, (error) => {
      if (error) {
        interaction.editReply("❌ Erreur lors de l'envoi du paquet Wake-on-LAN.");
      } else {
        interaction.editReply("⚡ Signal d'allumage envoyé ! Le PC Debian et Docker démarrent...");
      }
    });
  }
  // Si c'est stop_server, restart_server ou status_server,
  // ce bot ne fait rien : le bot local sur le PC prendra le relais.
});

client.login(process.env.DISCORD_TOKEN);
