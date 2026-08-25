const { Client, GatewayIntentBits } = require('discord.js');
const crypto = require('crypto');
const axios = require('axios'); // Assure-toi d'avoir installé axios (npm install axios)

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildsMessages] });

// Configuration Tuya (récupérée automatiquement depuis tes variables d'environnement)
const TUYA_CLIENT_ID = process.env.TUYA_CLIENT_ID;
const TUYA_CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const TUYA_DEVICE_ID = process.env.TUYA_DEVICE_ID;
// Choisis l'endpoint selon ta région (ex: https://openapi.tuyaeu.com pour l'Europe)
const TUYA_BASE_URL = 'https://openapi.tuyaeu.com'; 

// Fonction pour générer la signature Tuya et appeler l'API
async function sendTuyaCommand(commandCode, commandValue) {
    try {
        // 1. Obtenir un token d'accès Tuya
        const t = Date.now().toString();
        const signUrl = `/v1.0/token?grant_type=1`;
        const contentHash = crypto.createHash('sha256').update('').digest('hex');
        const stringToSign = `GET\n${contentHash}\n\n${signUrl}`;
        const signStr = TUYA_CLIENT_ID + t + stringToSign;
        const sign = crypto.createHmac('sha256', TUYA_CLIENT_SECRET).update(signStr).digest('hex').toUpperCase();

        const tokenRes = await axios.get(`${TUYA_BASE_URL}/v1.0/token?grant_type=1`, {
            headers: {
                client_id: TUYA_CLIENT_ID,
                sign: sign,
                t: t,
                sign_method: 'HMAC-SHA256'
            }
        });

        if (!tokenRes.data.success) throw new Error("Erreur d'authentification Tuya");
        const accessToken = tokenRes.data.result.access_token;

        // 2. Envoyer la commande à la prise (Allumer / Éteindre)
        const body = {
            commands: [{ code: commandCode, value: commandValue }]
        };

        const commandPath = `/v1.0/iot-03/devices/${TUYA_DEVICE_ID}/commands`;
        const t2 = Date.now().toString();
        const contentHash2 = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
        const stringToSign2 = `POST\n${contentHash2}\n\n${commandPath}`;
        const signStr2 = TUYA_CLIENT_ID + accessToken + t2 + stringToSign2;
        const sign2 = crypto.createHmac('sha256', TUYA_CLIENT_SECRET).update(signStr2).digest('hex').toUpperCase();

        await axios.post(`${TUYA_BASE_URL}${commandPath}`, body, {
            headers: {
                client_id: TUYA_CLIENT_ID,
                access_token: accessToken,
                sign: sign2,
                t: t2,
                sign_method: 'HMAC-SHA256',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Commande Tuya envoyée avec succès (${commandCode} : ${commandValue})`);
    } catch (error) {
        console.error("Erreur Tuya:", error.response?.data || error.message);
        throw error;
    }
}

client.once('ready', () => {
    console.log(`Bot cloud connecté en tant que ${client.user.tag}`);
});

// Gestion du clic sur le bouton Discord
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'btn_allumer_pc') {
        await interaction.reply({ content: "🚀 **Démarrage du PC en cours...** (Activation de la prise Tuya)", ephemeral: false });

        try {
            // Envoi de la commande pour allumer la prise (code standard Tuya pour interrupteur : 'switch_1')
            await sendTuyaCommand('switch_1', true);
        } catch (error) {
            await interaction.followUp({ content: "❌ Erreur lors de la communication avec la prise Tuya.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
