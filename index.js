const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    MessageFlags
} = require('discord.js');

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- KONFIGURÁCIÓ ---
const PORT = process.env.PORT || 10000;
const TOKEN = process.env.TOKEN;
const GUILD_ID = "1484897711663743168";
const ROLE_ID = "1494281710332940338";
const RULES_CHANNEL_ID = "1491041943088533605";
const BASE_URL = "https://documentation-k61j.onrender.com";

let tokens = {};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel]
});

// Hibaelszívó a stabilitásért
process.on('unhandledRejection', error => { console.error('Hiba:', error); });

client.once(Events.ClientReady, (c) => {
    console.log(`Bejelentkezve: ${c.user.tag}`);
});

// GOMB KEZELÉS (Javított interakcióval)
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {
        try {
            // DeferReply: Megoldja az "Unknown Interaction" hibát
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (interaction.member.roles.cache.has(ROLE_ID)) {
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
            }

            const token = uuidv4();
            tokens[token] = { userId: interaction.user.id, expires: Date.now() + 5 * 60 * 1000 };
            const link = `${BASE_URL}/verify/${token}`;

            const embed = new EmbedBuilder()
                .setTitle("Szabályzat Elfogadása")
                .setDescription(`Kattints a gombra a szabályzat megtekintéséhez:\n\n[Megnyitás a böngészőben](${link})`)
                .setColor("#5865F2");

            await interaction.editReply({ embeds: [embed] });
        } catch (error) { console.error("Gomb hiba:", error); }
    }
});

// WEB OLDAL (Hóesés + A kért szöveg)
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("A link lejárt.");

    res.send(`
    <html>
    <head>
        <title>Szabályzat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: #000; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
            .card { background: #11141d; width: 90%; max-width: 500px; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9); border: 1px solid #222; position: relative; z-index: 10; }
            .header { background: linear-gradient(to bottom, #1d2538, #11141d); padding: 30px; text-align: center; border-bottom: 1px solid #333;}
            .header h1 { margin: 0; font-size: 24px; color: #fff;}
            .content { padding: 30px; text-align: left; line-height: 1.6; font-size: 14px; color: #ccc; }
            .footer { padding: 20px; background: #0c0f16; text-align: center; display: flex; justify-content: center; gap: 15px; }
            .btn { padding: 12px 35px; border: none; font-size: 15px; cursor: pointer; border-radius: 25px; font-weight: bold; color: white; transition: 0.3s; }
            .btn-accept { background: #28a745; }
            .btn-deny { background: #dc3545; text-decoration: none; display: inline-block; }
            #snow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
            .snowflake { position: absolute; background-color: white; border-radius: 50%; opacity: 0.8; animation: fall linear infinite; }
            @keyframes fall { to { transform: translateY(100vh); } }
        </style>
    </head>
    <body>
        <div id="snow"></div>
        <div class="card">
            <div class="header"><h1>SZABÁLYZAT</h1></div>
            <div class="content">
                <b>Szabályzat</b><br>
                Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.<br><br>
                ━━━━━━━━━━━━━━━━━━━━━━<br><br>
                <b>Mit kapsz az elfogadás után:</b><br>
                ➤ Teljes hozzáférés az összes csatornához<br><br>
                <b>Fontos információk:</b><br>
                ➤ A szabályzat elfogadása egyszeri művelet, multi account = kitiltás<br>
                ➤ Olvasd át figyelmesen, mert a nem ismerete nem mentesít<br><br>
                ━━━━━━━━━━━━━━━━━━━━━━
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST" style="margin:0;"><button type="submit" class="btn btn-accept">Elfogadom</button></form>
                <a href="/deny" class="btn btn-deny"><button class="btn btn-deny" style="padding:0;">Nem fogadom el</button></a>
            </div>
        </div>
        <script>
            function createSnowflake() {
                const snowflake = document.createElement('div');
                snowflake.classList.add('snowflake');
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.width = Math.random() * 4 + 2 + 'px';
                snowflake.style.height = snowflake.style.width;
                snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
                document.getElementById('snow').appendChild(snowflake);
                setTimeout(() => snowflake.remove(), 5000);
            }
            setInterval(createSnowflake, 120);
        </script>
    </body>
    </html>
    `);
});

// SZABÁLYZAT KIKÜLDŐ (Discord üzenet formázása)
async function sendRules(channel) {
    const embed = new EmbedBuilder()
        .setTitle("Szabályzat")
        .setDescription(
            `Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**Mit kapsz az elfogadás után:**\n` +
            `➤ Teljes hozzáférés az összes csatornához\n\n` +
            `**Fontos információk:**\n` +
            `➤ A szabályzat elfogadása egyszeri művelet, multi account = kitiltás\n` +
            `➤ Olvasd át figyelmesen, mert a nem ismerete nem mentesít\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`
        )
        .setColor("#5865F2");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("verify")
            .setLabel("Megtekintés")
            .setEmoji("🔍")
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
}

app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("Lejárt link.");
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        await member.roles.add(ROLE_ID);
        delete tokens[req.params.token];
        res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;'><h1>Sikeres!</h1></body>");
    } catch (e) { res.send("Hiba történt."); }
});

app.get('/deny', (req, res) => {
    res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;'><h1>Sajnáljuk...</h1></body>");
});

app.listen(PORT, '0.0.0.0', () => { console.log("Web fut a porton:", PORT); });
client.login(TOKEN);
