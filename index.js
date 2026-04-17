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

// Hibaelszívó, hogy ne álljon le a bot váratlanul
process.on('unhandledRejection', error => {
    console.error('Hiba történt:', error);
});

client.once(Events.ClientReady, (c) => {
    console.log(`Bejelentkezve: ${c.user.tag}`);
});

// GOMB KEZELÉS (Javított, nem fog kifutni az időből)
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {
        try {
            // Azonnali válasz a Discordnak, hogy ne legyen "Unknown Interaction" hiba
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (interaction.member.roles.cache.has(ROLE_ID)) {
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
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

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Gomb hiba:", error);
        }
    }
});

// SZABÁLYZAT KIKÜLDÉSE (A pontos szöveggel, amit kértél)
async function sendRules(channel) {
    const embed = new EmbedBuilder()
        .setTitle("Szabályzat")
        .setDescription(
            `Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Mit kapsz az elfogadás után:\n` +
            `➤ Teljes hozzáférés az összes csatornához\n\n` +
            `Fontos információk:\n` +
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

// WEB OLDAL (Hóeséssel és a kép szerinti pontos elrendezéssel)
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("A link lejárt vagy érvénytelen.");

    res.send(`
    <html>
    <head>
        <title>Szabályzat Elfogadása</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                background: #000; color: white; font-family: sans-serif; 
                display: flex; justify-content: center; align-items: center; 
                height: 100vh; margin: 0; overflow: hidden; 
            }
            .container { 
                background: #11141d; width: 90%; max-width: 500px; 
                border-radius: 15px; overflow: hidden; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                border: 1px solid #1f2330; position: relative; z-index: 10;
            }
            .header { 
                background: linear-gradient(to bottom, #3b5998, #11141d); 
                padding: 30px; text-align: center; 
            }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
            .header p { margin: 10px 0 0; font-size: 14px; opacity: 0.8; }
            .content { padding: 30px; text-align: left; line-height: 1.5; font-size: 13px; color: #ccc; max-height: 300px; overflow-y: auto; }
            .footer { padding: 20px; background: #0d1017; text-align: center; display: flex; justify-content: center; gap: 15px; }
            .btn { 
                padding: 12px 35px; border: none; font-size: 15px; cursor: pointer; 
                border-radius: 25px; font-weight: bold; transition: 0.3s; color: white;
            }
            .btn-accept { background: #28a745; }
            .btn-deny { background: #dc3545; text-decoration: none; display: inline-block; line-height: 1.2; }
            
            /* Hóesés effekt */
            #snow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
            .snowflake { position: absolute; background-color: white; border-radius: 50%; opacity: 0.8; animation: fall linear infinite; }
            @keyframes fall { to { transform: translateY(100vh); } }
        </style>
    </head>
    <body>
        <div id="snow"></div>
        <div class="container">
            <div class="header">
                <h1>SZABÁLYZATUNK</h1>
                <p>Kérlek olvasd el figyelmesen!</p>
            </div>
            <div class="content">
                <b style="color:white; font-size:16px;">Discord Szabályzatunk</b><br><br>
                1. Légy tisztelettudó! Minden taggal kulturáltan kommunikálj.<br>
                2. Nincs gyűlöletbeszéd vagy diszkrimináció!<br>
                3. Tilos a spam és a floodolás minden formája!<br>
                4. Reklám és önpromóció csak engedéllyel!<br>
                5. Tartsd be a csatornák témáját!<br>
                6. Ne ossz meg másokról személyes adatokat!<br>
                7. Tilos bármilyen 18+ vagy illegális tartalom.<br>
                8. Kövesd az adminok és moderátorok utasításait!<br>
                9. Ne élj vissza a botokkal és funkciókkal!
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST" style="margin:0;">
                    <button type="submit" class="btn btn-accept">Elfogadom</button>
                </form>
                <a href="/deny" class="btn btn-deny">Nem fogadom el</a>
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
            setInterval(createSnowflake, 100);
        </script>
    </body>
    </html>
    `);
});

app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("Lejárt link.");
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        await member.roles.add(ROLE_ID);
        delete tokens[req.params.token];
        res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;font-family:sans-serif;'><h1>Sikeres elfogadás!</h1><p>Most már visszatérhetsz Discordra.</p></body>");
    } catch (e) { res.send("Hiba történt a rang kiosztása közben."); }
});

app.get('/deny', (req, res) => {
    res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;font-family:sans-serif;'><h1>Sajnáljuk...</h1><p>Amennyiben nem fogadod el akkor nem fogsz tudni részt venni közzösségünkben!</p></body>");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Web fut a porton:", PORT);
});

client.login(TOKEN);
