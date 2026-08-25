const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const https = require('https');
const crypto = require('crypto');
const http = require('http');

// Serveur Web minimaliste pour maintenir le service actif sur Render
http.createServer((req, res) => {
  res.write("Bot Discord Prise Tuya opérationnel !");
  res.end();
}).listen(process.env.PORT || 10000);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID;
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const TUYA_DEVICE_ID = process.env.TUYA_DEVICE_ID;
const CHANNEL_ID = '1538210006216867850';

// Fonction pour signer et envoyer la requête à l'API Tuya (Allumer la prise)
async function turnOnPC() {
  return new Promise((resolve, reject) => {
    const t = Date.now().toString();
    const signUrl = `/v1.0/iot-03/devices/${TUYA_DEVICE_ID}/commands`;
    
    const contentHash = crypto.createHash('sha256').update(JSON.stringify({
      commands: [{ code: "switch_1", value: true }]
    })).digest('hex');
    
    const stringToSign = `POST\n${contentHash}\n\n${signUrl}`;
    const signStr = TUYA_CLIENT_ID + t + stringToSign;
    const sign = crypto.createHmac('sha256', TUYA_CLIENT_SECRET).update(signStr).digest('hex').toUpperCase();

    https.get({
      hostname: 'openapi.eu.tuya.com',
      path: '/v1.0/token?grant_type=1',
      headers: {
        'client_id': TUYA_CLIENT_ID,
        'sign': crypto.createHmac('sha256', TUYA_CLIENT_SECRET).update(TUYA_CLIENT_ID + t).digest('hex').toUpperCase(),
        't': t,
        'sign_method': 'HMAC-SHA256'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (!response.success) return reject("Erreur d'authentification Tuya");
          const accessToken = response.result.access_token;
          const t2 = Date.now().toString();

          const signStr2 = TUYA_CLIENT_ID + accessToken + t2 + `POST\n${contentHash}\n\n${signUrl}`;
          const sign2 = crypto.createHmac('sha256', TUYA_CLIENT_SECRET).update(signStr2).digest('hex').toUpperCase();

          const reqPost = https.request({
            hostname: 'openapi.eu.tuya.com',
            path: signUrl,
            method: 'POST',
            headers: {
              'client_id': TUYA_CLIENT_ID,
              'access_token': accessToken,
              'sign': sign2,
              't': t2,
              'sign_method': 'HMAC-SHA256',
              'Content-Type': 'application/json'
            }
          }, (resPost) => {
            let resData = '';
            resPost.on('data', chunk => resData += chunk);
            resPost.on('end', () => {
              const r = JSON.parse(resData);
              if (r.success) resolve();
              else reject(r.msg || "Erreur lors de l'envoi de la commande");
            });
          });

          reqPost.on('error', err => reject(err.message));
          reqPost.write(JSON.stringify({ commands: [{ code: "switch_1", value: true }] }));
          reqPost.end();

        } catch (e) {
          reject(e.message);
        }
      });
    }).on('error', err => reject(err.message));
  });
}

client.on('ready', async () => {
  console.log(`Bot cloud Tuya prêt : ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('wake_pc')
            .setLabel('⚡ Allumer le PC Debian')
            .setStyle(ButtonStyle.Success)
        );

      // Envoie le message avec le bouton dans le salon
      await channel.send({
        content: "🎛️ **Panneau de contrôle du serveur :**\nUtilise le bouton ci-dessous pour rétablir le courant et démarrer le PC à distance :",
        components: [row]
      });
      console.log("Bouton d'allumage posté dans le salon avec succès !");
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi du message avec le bouton :", err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;

  if (id === 'wake_pc' || id === 'start_mc' || id.includes('start') || id.includes('wake')) {
    await interaction.deferReply({ ephemeral: true });

    try {
      await turnOnPC();
      interaction.editReply("⚡ Ordre envoyé à la prise ZenGo ! Le courant est rétabli, le PC Debian démarre...");
    } catch (error) {
      interaction.editReply(`❌ Erreur Tuya : ${error}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
