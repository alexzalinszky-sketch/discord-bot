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
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

// Globális hibakezelő, hogy ne álljon le a bot váratlanul
process.on('unhandledRejection', error => {
    console.error('Nem várt hiba:', error);
});

// clientReady használata a ready helyett (v15 kompatibilitás)
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
    } catch (e) { console.error("Csatorna ellenőrzési hiba:", e); }
});

// INTERAKCIÓ KEZELÉS (Javítva az Unknown Interaction hiba)
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {
        try {
            // 1. Azonnali válasz a Discordnak (Gondolkodik...), így nem jár le a 3 mp-es limit
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            if (interaction.member.roles.cache.has(ROLE_ID)) {
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
            }

            const token = uuidv4();
            tokens[token] = { userId: interaction.user.id, expires: Date.now() + 5 * 60 * 1000 };
            const link = `${BASE_URL}/verify/${token}`;

            const embed = new EmbedBuilder()
                .setTitle("Szabályzat Elfogadása")
                .setDescription(`Kattints a gombra a szabályzat megtekintéséhez és elfogadásához:\n\n[Megnyitás a böngészőben](${link})`)
                .setColor("#5865F2");

            // 2. Az editReply-t használjuk a deferReply után
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Gomb interakció hiba:", error);
            // Ha még nem válaszoltunk, megpróbáljuk elküldeni a hibát
            if (interaction.deferred) {
                await interaction.editReply({ content: "Hiba történt a folyamat során." }).catch(() => {});
            }
        }
    }
});

// --- WEB SZERVER ---
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("A link lejárt vagy érvénytelen.");

    // Itt a hosszú szabályzatod a HTML-ben...
    res.send(`
    <html>
    <head>
        <title>Szabályzat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: #000; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            .card { background: #11141d; width: 95%; max-width: 650px; border-radius: 15px; padding: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.9); border: 1px solid #222; overflow: hidden; }
            .header { background: linear-gradient(to bottom, #1d2538, #11141d); padding: 20px; text-align: center; border-bottom: 1px solid #333;}
            .content { padding: 25px; line-height: 1.6; font-size: 13px; color: #ccc; max-height: 60vh; overflow-y: auto; }
            .footer { padding: 20px; background: #0c0f16; text-align: center; border-top: 1px solid #222; }
            .btn { padding: 12px 40px; border: none; font-size: 16px; cursor: pointer; border-radius: 25px; font-weight: bold; color: white; background: #28a745; transition: 0.3s; }
            .btn:hover { background: #218838; transform: scale(1.05); }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header"><h1>SZABÁLYZATUNK</h1></div>
            <div class="content">
                <h3>Discord Szabályzatunk</h3>
                1. Légy tisztelettudó!<br>
                2. Nincs gyűlöletbeszéd!<br>
                3. Tilos a spamelés!<br>
                4. Reklám csak engedéllyel!<br>
                5. Tartsd be a csatornák témáját!<br>
                6. Ne ossz meg személyes adatokat!<br>
                7. Tartalomkorlátozás (18+ tilos)!<br>
                8. Kövesd a moderátorokat!<br>
                9. Ne élj vissza a botokkal!<br>
                10. A jó hangulat közös felelősség!<br>
                11. A Tulajdonos pingelése TILOS!<br>
                12. Külső tradekért nem vállalunk felelősséget!<br>
                13. Ne használj provokatív nevet!<br>
                14. Kulturált hangcsatorna használat!<br>
                15. DM spam tilos!<br>
                <hr>
                <h3>Roblox Szabályzatunk</h3>
                1. Tisztelet minden játékosnak!<br>
                2. Csalás/Exploit tilos!<br>
                3. Ne rontsd más játékát!<br>
                4. Chat spam tilos!<br>
                5. Adatvédelem!<br>
                6. Reklám tilos!<br>
                7. Moderátorok követése!<br>
                8. Nem megfelelő tartalom tilos!<br>
                9. Szabályszegés tiltást von maga után!
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST">
                    <button type="submit" class="btn">Elfogadom</button>
                </form>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("Hiba: Érvénytelen munkamenet.");

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        
        await member.roles.add(ROLE_ID);
        
        // DM küldése
        await member.send("✅ **Sikeresen elfogadtad a szabályzatot!**\nKöszönjük a jelentkezésedet, jó szórakozást a szerveren!").catch(() => {
            console.log(`${member.user.tag} lezárt DM-ekkel rendelkezik, nem kapott üzenetet.`);
        });

        delete tokens[req.params.token];
        res.send("<html><body style='background:#000;color:#28a745;text-align:center;padding-top:50px;font-family:sans-serif;'><h1>Sikeresen elfogadtad!</h1><p style='color:white;'>Most már bezárhatod ezt az ablakot.</p></body></html>");
    } catch (e) {
        console.error("Hiba a rang kiosztásakor:", e);
        res.send("Hiba történt a rang kiosztása közben. Kérlek jelezd egy adminnak!");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Webserver fut a porton:", PORT);
});

client.login(TOKEN);
