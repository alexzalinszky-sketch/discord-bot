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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const app = express();
app.use(express.urlencoded({ extended: true }));

const TOKEN = process.env.TOKEN;
const GUILD_ID = "1484897711663743168";
const ROLE_ID = "1494281710332940338";
const RULES_CHANNEL_ID = "1491041943088533605";

let tokens = {};

// BOT READY
client.on('ready', async () => {
    console.log(`Bejelentkezve: ${client.user.tag}`);

    // szabályzat üzenet automatikus küldés
    const channel = await client.channels.fetch(RULES_CHANNEL_ID);
    if (channel) sendRules(channel);
});

// BELÉPÉS
client.on('guildMemberAdd', async member => {
    try {
        await member.roles.set([]); // nincs rang
    } catch {}
});

// GOMB KEZELÉS (csak neki látszik)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {

        const token = uuidv4();

        tokens[token] = {
            userId: interaction.user.id,
            expires: Date.now() + 5 * 60 * 1000
        };

        const link = `http://localhost:3000/verify/${token}`;

        const embed = new EmbedBuilder()
            .setTitle("Szabályzat Elfogadása")
            .setDescription(
`Kattints az alábbi gombra a szabályzat megtekintéséhez és elfogadásához:

A gombra kattintva megnyílik a böngésződ
A link 5 percig érvényes

Ha nem nyílik meg automatikusan, másold be a linket a böngésződbe:

${link}`
            )
            .setColor("Blue");

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
});

// SZABÁLYZAT EMBED (CSATORNÁBA)
async function sendRules(channel) {

    const embed = new EmbedBuilder()
        .setTitle("Szabályzat")
        .setDescription(
`Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.

━━━━━━━━━━━━━━━━━━━━━━

Mit kapsz az elfogadás után:
➤ Teljes hozzáférés az összes csatornához

Fontos információk:
➤ A szabályzat elfogadása egyszeri művelet, multi account = kitiltás
➤ Olvasd át figyelmesen, mert a nem ismerete nem mentesít

━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("verify")
            .setLabel("Megtekintés")
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
        embeds: [embed],
        components: [row]
    });
}

// WEBOLDAL
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];

    if (!data || data.expires < Date.now()) {
        return res.send("A link lejárt.");
    }

    res.send(`
    <html>
    <body style="background:#111;color:white;font-family:sans-serif;text-align:center;padding:40px">

        <h1>SZABÁLYZATUNK</h1>
        <p>Kérlek olvasd el figyelmesen</p>

        <div style="text-align:left;max-width:800px;margin:auto">
        <p>
        1. Légy tisztelettudó<br>
        2. Nincs gyűlöletbeszéd<br>
        3. Tilos a spam<br>
        4. Reklám csak engedéllyel<br>
        5. Tartsd be a csatornák témáját<br>
        6. Ne ossz meg személyes adatokat<br>
        7. Tilos 18+ tartalom<br>
        8. Kövesd az adminok utasításait<br>
        9. Ne élj vissza botokkal<br>
        10. Jó hangulat közös felelősség
        </p>
        </div>

        <br><br>

        <form action="/accept/${req.params.token}" method="POST">
            <button style="background:green;color:white;padding:15px;border:none;font-size:18px">Elfogadom</button>
        </form>

        <br>

        <form action="/deny" method="GET">
            <button style="background:red;color:white;padding:15px;border:none;font-size:18px">Nem fogadom el</button>
        </form>

    </body>
    </html>
    `);
});

// ELFOGADÁS
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];

    if (!data || data.expires < Date.now()) {
        return res.send("A link lejárt.");
    }

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(data.userId);

    await member.roles.add(ROLE_ID);

    try {
        await member.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Üdv Köztünk")
                    .setDescription("Sikeresen elfogadtad a szabályzatot Mostantól hozzáférsz az összes csatornához")
                    .setColor("Green")
            ]
        });
    } catch {}

    delete tokens[req.params.token];

    res.send("Sikeres elfogadás Visszatérhetsz Discordra");
});

// ELUTASÍTÁS
app.get('/deny', (req, res) => {
    res.send("Nem fogadtad el a szabályzatot.");
});

// INDÍTÁS
app.listen(3000, () => {
    console.log("Web fut a 3000 porton");
});

client.login(TOKEN);