const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// Importe ici ta logique ou ton client pour l'API Tuya

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildsMessages] });

// Exemple de fonction pour allumer la prise via l'API Tuya
async function turnOnTuyaDevice() {
    // Ton code d'authentification et requete API Tuya pour mettre le switch à true
    console.log("Envoi de la commande d'allumage à la prise Tuya...");
}

client.once('ready', () => {
    console.log(`Bot cloud connecté en tant que ${client.user.tag}`);
});

// Gestion du clic sur le bouton Discord
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'btn_allumer_pc') {
        // 1. On répond tout de suite à l'interaction pour éviter l'expiration
        await interaction.reply({ content: "🚀 **Démarrage du PC en cours...** (Allumage de la prise Tuya)", ephemeral: false });

        try {
            // 2. On déclenche la prise Tuya
            await turnOnTuyaDevice();
            
            // La prise s'allume, le courant arrive, le PC boot, 
            // et c'est ensuite ton bot local qui prendra le relais sur le salon !
        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: "❌ Erreur lors de l'allumage de la prise Tuya.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
