const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- KONFIGURÁCIÓ ---
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const GUILD_ID = "1484897711663743168";
const ROLE_ID = "1494281710332940338";
const RULES_CHANNEL_ID = "1491041943088533605";
const BASE_URL = "https://documentation-k61j.onrender.com";

let tokens = {};

// Express szerver indítása
app.listen(PORT, '0.0.0.0', () => {
    console.log("Web fut a porton:", PORT);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// BOT READY
client.on('ready', async () => {
    console.log(`Bejelentkezve: ${client.user.tag}`);
    // Opcionális: Ha szeretnéd, hogy indításkor beküldje a szabályzatot, vedd ki a kommentet:
    // const channel = await client.channels.fetch(RULES_CHANNEL_ID);
    // if (channel) sendRules(channel);
});

// GOMB KEZELÉS
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {
        // Ellenőrzés: Már elfogadta?
        if (interaction.member.roles.cache.has(ROLE_ID)) {
            return await interaction.reply({
                content: "Már elfogadtad a szabályzatot!",
                ephemeral: true
            });
        }

        const token = uuidv4();
        tokens[token] = {
            userId: interaction.user.id,
            expires: Date.now() + 5 * 60 * 1000
        };

        const link = `${BASE_URL}/verify/${token}`;

        const embed = new EmbedBuilder()
            .setTitle("Szabályzat Elfogadása")
            .setDescription(
                `Kattints az alábbi gombra a szabályzat megtekintéséhez és elfogadásához:\n\n` +
                `• A gombra kattintva megnyílik a böngésződ\n` +
                `• A link 5 percig érvényes\n\n` +
                `Ha nem nyílik meg automatikusan: [Kattints ide](${link})`
            )
            .setColor("#5865F2");

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
});

// FŐ SZABÁLYZAT ÜZENET (Kép alapján frissítve)
async function sendRules(channel) {
    const embed = new EmbedBuilder()
        .setTitle("Szabályzat")
        .setDescription(
            `Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.\n\n` +
            `--------------------------\n\n` +
            `**Mit kapsz az elfogadás után:**\n` +
            `➤ Teljes hozzáférés az összes csatornához\n\n` +
            `**Fontos információk:**\n` +
            `➤ A szabályzat elfogadása egyszeri művelet, multi account = kitiltás\n` +
            `➤ Olvasd át figyelmesen, mert a nem ismerete nem mentesít\n\n` +
            `--------------------------`
        )
        .setColor("#5865F2");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("verify")
            .setLabel("Megtekintés")
            .setEmoji("🔍") // Ikon a kép alapján
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
        embeds: [embed],
        components: [row]
    });
}

// WEB: VERIFIKÁCIÓS OLDAL
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) {
        return res.send("A link lejárt vagy érvénytelen.");
    }

    res.send(`
    <html>
    <head>
        <title>Szabályzat Elfogadása</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: #111; color: white; font-family: 'Helvetica Neue', Arial, sans-serif; text-align: center; padding: 50px 20px; }
            .card { background: #1a1a1a; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid #333; }
            h1 { color: #5865F2; }
            .btn { padding: 15px 30px; border: none; font-size: 16px; cursor: pointer; border-radius: 5px; font-weight: bold; text-decoration: none; display: inline-block; margin: 10px; transition: 0.3s; }
            .btn-accept { background: #2ecc71; color: white; }
            .btn-accept:hover { background: #27ae60; }
            .btn-deny { background: #e74c3c; color: white; }
            .btn-deny:hover { background: #c0392b; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>SZABÁLYZAT</h1>
            <p>Kérjük, kattints az elfogadáshoz a szerverhez való csatlakozáshoz.</p>
            <form action="/accept/${req.params.token}" method="POST">
                <button type="submit" class="btn btn-accept">Elfogadom</button>
                <a href="/deny" class="btn btn-deny">Nem fogadom el</a>
            </form>
        </div>
    </body>
    </html>
    `);
});

// WEB: ELFOGADVA
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("Lejárt link.");

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);

        await member.roles.add(ROLE_ID);

        // Visszajelzés a felhasználónak Discordon
        try {
            const successEmbed = new EmbedBuilder()
                .setTitle("Üdv Köztünk!")
                .setDescription("Sikeresen elfogadtad a szabályzatot, a rangod megkaptad.")
                .setColor("Green");
            await member.send({ embeds: [successEmbed] });
        } catch (e) {}

        delete tokens[req.params.token];
        res.send(`
            <body style="background:#111;color:white;text-align:center;padding:50px;font-family:sans-serif;">
                <h1 style="color:#2ecc71;">Sikeres elfogadás!</h1>
                <p>Most már visszatérhetsz a Discordra.</p>
            </body>
        `);
    } catch (err) {
        res.send("Hiba történt a rang kiosztása közben.");
    }
});

// WEB: ELUTASÍTVA
app.get('/deny', (req, res) => {
    res.send(`
        <body style="background:#111;color:white;text-align:center;padding:50px;font-family:sans-serif;">
            <h1 style="color:#e74c3c;">Sajnáljuk...</h1>
            <p>Amennyiben nem fogadod el akkor nem fogsz tudni részt venni közzösségünkben!</p>
        </body>
    `);
});

client.login(TOKEN);
