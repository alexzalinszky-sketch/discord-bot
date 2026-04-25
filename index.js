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
const RULES_CHANNEL_ID = "1491041943088533605";

// --- RANGOK ---
const ROLE_ID = "1494281710332940338"; // Első (hitelesített) rang
const SECOND_ROLE_ID = "1491052815458504894"; // Második rang ID-je

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

// INTERAKCIÓ KEZELÉS
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "verify") {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Ellenőrizzük, hogy van-e már megadott rangja
            if (interaction.member.roles.cache.has(ROLE_ID)) {
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
            }

            const token = uuidv4();
            tokens[token] = { userId: interaction.user.id, expires: Date.now() + 5 * 60 * 1000 };
            const link = `${BASE_URL}/verify/${token}`;

            // Képen látható új embed kialakítás
            const embed = new EmbedBuilder()
                .setTitle("Szabályzat Elfogadása")
                .setDescription(
                    `**Kattints az alábbi gombra a szabályzat megtekintéséhez és elfogadásához:**\n\n` +
                    `📘 **A gombra kattintva megnyílik a böngésződ**\n` +
                    `⏰ **A link 5 percig érvényes**\n\n` +
                    `*Ha nem nyílik meg automatikusan, másold be a linket a böngésződbe:*\n\`${link}\``
                )
                .setColor("#2b2d31");

            // Képen látható Link gomb
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("SZABÁLYZAT ELFOGADÁSA")
                    .setURL(link)
                    .setStyle(ButtonStyle.Link)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error("Gomb interakció hiba:", error);
            if (interaction.deferred) {
                await interaction.editReply({ content: "Hiba történt a folyamat során." }).catch(() => {});
            }
        }
    }
});

// --- WEB SZERVER ---
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>A link lejárt vagy érvénytelen.</h2></body>");

    // Képen látható weblap dizájn
    res.send(`
    <html>
    <head>
        <title>Szabályzat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                background: #0b0d14 radial-gradient(circle at 50% 50%, #151a28 0%, #0b0d14 100%); 
                color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; 
            }
            .card { 
                background: #11141d; width: 95%; max-width: 700px; border-radius: 12px; 
                padding: 0; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid #1f2533; overflow: hidden; 
            }
            .header { 
                background: linear-gradient(to bottom, #2b5b84, #182a40); 
                padding: 30px 20px; text-align: center; border-bottom: 1px solid #2b5b84; 
            }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; color: #ffffff; }
            .header p { margin: 10px 0 0 0; font-size: 13px; color: #a3c2e0; }
            .content { padding: 30px; line-height: 1.7; font-size: 14px; max-height: 50vh; overflow-y: auto; }
            .content h3 { 
                color: #ffffff; border-left: 4px solid #4791db; padding-left: 10px; margin-top: 0; margin-bottom: 20px; 
            }
            .content p { margin-bottom: 10px; }
            .footer { 
                padding: 20px; background: #0c0f16; text-align: center; border-top: 1px solid #1f2533; 
                display: flex; justify-content: center; gap: 20px;
            }
            .btn { 
                padding: 12px 30px; border: none; font-size: 15px; cursor: pointer; 
                border-radius: 25px; font-weight: bold; color: white; transition: 0.2s; 
            }
            .btn-accept { background: #2e8b57; }
            .btn-accept:hover { background: #3cb371; transform: scale(1.02); }
            .btn-decline { background: #c62828; }
            .btn-decline:hover { background: #e53935; transform: scale(1.02); }
            
            /* Gördítősáv formázása */
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #11141d; }
            ::-webkit-scrollbar-thumb { background: #2b5b84; border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #4791db; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>SZABÁLYZATUNK</h1>
                <p>Kérlek olvasd el figyelmesen!</p>
            </div>
            <div class="content">
                <h3>Discord Szabályzatunk</h3>
                <p>1. Légy tisztelettudó! Minden taggal kulturáltan és tiszteletteljesen kommunikálj. A sértegetés, gyűlölködés, bántalmazó viselkedés vagy bárminemű zaklatás szigorúan tilos.</p>
                <p>2. Nincs gyűlöletbeszéd vagy diszkrimináció! Tilos bármilyen rasszista, szexista, homofób, vallási vagy más sértő megnyilvánulás. Mindenkit egyenlően kezelünk.</p>
                <p>3. Tilos a spamelés és floodolás! Indokolatlan, ismétlődő üzenetek, karakterek, linkek vagy említések halmozása nem megengedett.</p>
                <p>4. Reklám és önpromóció csak engedéllyel! Más Discord szerverek, csatornák, oldalak vagy szolgáltatások hirdetése kizárólag az adminisztrátorok előzetes engedélyével engedélyezett.</p>
                <p>5. Tartsd be a csatornák témáját! Mindig az adott csatorna témájához kapcsolódj. Off-topic beszélgetések csak a kijelölt helyen folytathatók.</p>
                <p>6. Ne ossz meg személyes adatokat! Szigorúan tilos saját vagy más személyek adatait (név, cím, telefonszám, jelszó stb.) nyilvánosan megosztani.</p>
                <p>7. Tartalomkorlátozás! Tilos bármilyen 18+, erőszakos, jogsértő vagy illegális tartalom megosztása.</p>
                <p>8. Kövesd az adminok és moderátorok utasításait! A szabályok betartatása az ő feladatuk. A döntésüket tiszteletben kell tartani.</p>
                <p>9. Ne élj vissza a botokkal és funkciókkal! A botok és szerver funkciók szándékos túlterhelése, spammelése vagy szabotálása tilos.</p>
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST">
                    <button type="submit" class="btn btn-accept">Elfogadom</button>
                </form>
                <form action="/decline/${req.params.token}" method="POST">
                    <button type="submit" class="btn btn-decline">Nem fogadom el</button>
                </form>
            </div>
        </div>
    </body>
    </html>
    `);
});

// Elfogadás végpont - KÉT RANG KIOSZTÁSA
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>Hiba: Érvénytelen vagy lejárt munkamenet.</h2></body>");

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        
        // --- ITT ADJA HOZZÁ A KÉT RANGOT ---
        await member.roles.add([ROLE_ID, SECOND_ROLE_ID]);
        
        // DM küldése
        await member.send("✅ **Sikeresen elfogadtad a szabályzatot!**\nKöszönjük a jelentkezésedet, jó szórakozást a szerveren!").catch(() => {
            console.log(`${member.user.tag} lezárt DM-ekkel rendelkezik, nem kapott üzenetet.`);
        });

        delete tokens[req.params.token];
        res.send(`
        <html lang="hu">
            <body style='background:#0b0d14;color:#3cb371;text-align:center;padding-top:100px;font-family:sans-serif;'>
                <h2>Sikeresen elfogadtad a szabályzatot!</h2>
                <p style='color:#ccc;'>A rangjaid kiosztásra kerültek. Most már bezárhatod ezt az ablakot.</p>
            </body>
        </html>`);
    } catch (e) {
        console.error("Hiba a rang kiosztásakor:", e);
        res.send("<body style='background:#0f111a;color:#e53935;text-align:center;margin-top:50px;'><h2>Hiba történt a rang kiosztása közben. Kérlek jelezd egy adminnak!</h2></body>");
    }
});

// Elutasítás végpont
app.post('/decline/:token', (req, res) => {
    delete tokens[req.params.token]; // Token törlése
    res.send(`
    <html lang="hu">
        <body style='background:#0b0d14;color:#e53935;text-align:center;padding-top:100px;font-family:sans-serif;'>
            <h2>Elutasítottad a szabályzatot.</h2>
            <p style='color:#ccc;'>Nem kaptál rangot. Ha megváltoztatod a döntésed, kérj új linket a szerveren.</p>
        </body>
    </html>`);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log("Webserver fut a porton:", PORT);
});

client.login(TOKEN);
