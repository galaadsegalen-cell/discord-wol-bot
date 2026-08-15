const { Client, GatewayIntentBits } = require('discord.js');
const wol = require('wake_on_lan');
const http = require('http');

// Petit serveur Web pour garder Render actif
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

  // Informe Discord immédiatement qu'on traite l'action (évite le timeout de 3 sec)
  await interaction.deferReply({ ephemeral: true });

  const id = interaction.customId;

  // Si l'un des boutons d'allumage/démarrage est cliqué
  if (id === 'wake_pc' || id === 'start_mc' || id.includes('start') || id.includes('wake')) {
    wol.wake(MAC_ADDRESS, { address: BROADCAST_IP }, (error) => {
      if (error) {
        interaction.editReply("❌ Erreur lors de l'envoi du paquet Wake-on-LAN.");
      } else {
        interaction.editReply("⚡ Signal d'allumage envoyé ! Le PC Debian et Docker démarrent...");
      }
    });
  } else {
    // Pour les autres boutons (Arrêter, Redémarrer, Statut)
    interaction.editReply(`ℹ️ Action \`${id}\` reçue. Le bot WoL gère uniquement l'allumage du PC éteint.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
