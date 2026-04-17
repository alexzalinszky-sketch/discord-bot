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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages // DM-hez szükséges
    ],
    partials: [Partials.Channel, Partials.Message]
});

process.on('unhandledRejection', error => { console.error('Hiba:', error); });

// --- AUTOMATIKUS KÜLDÉS ÉS BEJELENTKEZÉS ---
client.once(Events.ClientReady, async (c) => {
    console.log(`Bejelentkezve: ${c.user.tag}`);

    try {
        const channel = await client.channels.fetch(RULES_CHANNEL_ID);
        if (channel) {
            const messages = await channel.messages.fetch({ limit: 10 });
            const alreadySent = messages.some(m => m.author.id === client.user.id);

            if (!alreadySent) {
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
        }
    } catch (e) { console.error("Csatorna hiba:", e); }
});

// GOMB KEZELÉS
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId === "verify") {
        try {
            await interaction.deferReply({ ephemeral: true });
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

// --- WEBOLDAL AZ ÖSSZES ÚJ SZABÁLLYAL ---
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("A link lejárt.");

    res.send(`
    <html>
    <head>
        <title>Szabályzat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: #000; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; overflow-x: hidden; }
            .card { background: #11141d; width: 90%; max-width: 650px; border-radius: 15px; margin: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.9); border: 1px solid #222; position: relative; z-index: 10; display: flex; flex-direction: column; }
            .header { background: linear-gradient(to bottom, #1d2538, #11141d); padding: 25px; text-align: center; border-bottom: 1px solid #333;}
            .header h1 { margin: 0; font-size: 22px; color: #fff; letter-spacing: 1px;}
            .content { padding: 25px; line-height: 1.6; font-size: 13px; color: #ccc; max-height: 60vh; overflow-y: auto; text-align: left; }
            .section-title { color: #5865F2; font-size: 16px; font-weight: bold; margin-top: 15px; border-left: 3px solid #5865F2; padding-left: 10px; }
            .footer { padding: 20px; background: #0c0f16; text-align: center; display: flex; justify-content: center; gap: 15px; border-top: 1px solid #222; }
            .btn { padding: 12px 30px; border: none; font-size: 15px; cursor: pointer; border-radius: 25px; font-weight: bold; color: white; transition: 0.3s; }
            .btn-accept { background: #28a745; }
            .btn-deny { background: #dc3545; text-decoration: none; }
            #snow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
            .snowflake { position: absolute; background-color: white; border-radius: 50%; opacity: 0.8; animation: fall linear infinite; }
            @keyframes fall { to { transform: translateY(100vh); } }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        </style>
    </head>
    <body>
        <div id="snow"></div>
        <div class="card">
            <div class="header"><h1>SZABÁLYZATUNK</h1><p style="font-size:12px; opacity:0.6;">Kérlek olvasd el figyelmesen!</p></div>
            <div class="content">
                <div class="section-title">Discord Szabályzatunk</div>
                1. Légy tisztelettudó! Minden taggal kulturáltan és tiszteletteljesen kommunikálj...<br>
                2. Nincs gyűlöletbeszéd vagy diszkrimináció! Mindenkit egyenlően kezelünk.<br>
                3. Tilos a spamelés és floodolás!<br>
                4. Reklám és önpromóció csak engedéllyel!<br>
                5. Tartsd be a csatornák témáját!<br>
                6. Ne ossz meg személyes adatokat!<br>
                7. Tartalomkorlátozás! Tilos 18+, erőszakos vagy illegális tartalom.<br>
                8. Kövesd az adminok és moderátorok utasításait!<br>
                9. Ne élj vissza a botokkal és funkciókkal!<br>
                10. A jó hangulat közös felelősség!<br>
                11. A Tulajdonos pingelése TILOS!<br>
                12. Külső tradekért nem vállalunk felelősséget!<br>
                13. Ne használj provokatív vagy félrevezető felhasználónevet!<br>
                14. A hangcsatornákban viselkedj kulturáltan!<br>
                15. Tilos a sértő vagy nem kívánt megkeresés (DM spam)!<br>

                <div class="section-title">Roblox Szabályzatunk</div>
                1. Légy tisztelettudó minden játékossal szemben!<br>
                2. Ne használj csalást vagy exploitot!<br>
                3. Ne rontsd más játékélményét!<br>
                4. Tilos a chat spamelése!<br>
                5. Ne ossz meg személyes adatokat!<br>
                6. Reklám csak engedéllyel!<br>
                7. Kövesd az adminok és moderátorok utasításait!<br>
                8. Tilos a nem megfelelő tartalom!<br>
                9. Szabályszegés következményekkel jár!<br><br>
                <i>A szabályzat elfogadásával kötelezően betartod mind a Discord, mind a Roblox szabályokat!</i>
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST" style="margin:0;"><button type="submit" class="btn btn-accept">Elfogadom</button></form>
                <a href="/deny" class="btn btn-deny"><button class="btn btn-deny" style="padding:0; border:none; background:none; cursor:pointer; color:white; font-weight:bold;">Nem fogadom el</button></a>
            </div>
        </div>
        <script>
            function createSnowflake() {
                const snowflake = document.createElement('div');
                snowflake.classList.add('snowflake');
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.width = Math.random() * 3 + 2 + 'px';
                snowflake.style.height = snowflake.style.width;
                snowflake.style.animationDuration = Math.random() * 3 + 4 + 's';
                document.getElementById('snow').appendChild(snowflake);
                setTimeout(() => snowflake.remove(), 6000);
            }
            setInterval(createSnowflake, 150);
        </script>
    </body>
    </html>
    `);
});

// --- ELFOGADÁS + DM ÜZENET ---
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("Lejárt link.");
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        
        // Rang kiosztása
        await member.roles.add(ROLE_ID);
        
        // DM Üzenet küldése
        try {
            await member.send("✅ **Sikeresen elfogadtad a szabályzatot!**\nKöszönjük a jelentkezésedet, most már minden csatornához hozzáférsz a szerveren.");
        } catch (dmError) {
            console.log("Nem sikerült DM-et küldeni (lehet le van tiltva náluk).");
        }

        delete tokens[req.params.token];
        res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;font-family:sans-serif;'><h1>Sikeresen elfogadtad!</h1><p>Visszatérhetsz Discordra.</p></body>");
    } catch (e) { res.send("Hiba történt."); }
});

app.get('/deny', (req, res) => {
    res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;font-family:sans-serif;'><h1>Sajnáljuk...</h1><p>Szabályzat elfogadása nélkül nem tudsz csatlakozni.</p></body>");
});

app.listen(PORT, '0.0.0.0', () => { console.log("Web fut a porton:", PORT); });
client.login(TOKEN);
