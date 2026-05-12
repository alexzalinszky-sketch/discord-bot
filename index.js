const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    MessageFlags,
    WebhookClient  // <--- EZT ADD HOZZÁ
} = require('discord.js');

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- KONFIGURÁCIÓ ---
const PORT = process.env.PORT || 10000;
const TOKEN = process.env.TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;  // <--- EZT ADD HOZZÁ
const GUILD_ID = "1484897711663743168";
const RULES_CHANNEL_ID = "1491041943088533605";

// --- RANGOK ---
const ROLE_ID = "1494281710332940338";
const SECOND_ROLE_ID = "1491052815458504894";

const BASE_URL = "https://documentation-k61j.onrender.com";

const tokens = new Map();

// =========================================================================
// WEBHOOK LOG RENDSZER - IDE ADD BE
// =========================================================================
const webhook = WEBHOOK_URL ? new WebhookClient({ url: WEBHOOK_URL }) : null;

async function sendLog(type, title, extraFields = []) {
    if (!webhook) return;
    const colors = {
        info: 0x5865F2, success: 0x57F287, warning: 0xFEE75C, error: 0xED4245,
        verify: 0x9B59B6, system: 0x95A5A6, user: 0x3498DB, token: 0xE67E22,
        request: 0x1ABC9C, danger: 0xE74C3C
    };
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(colors[type] || colors.info)
        .setTimestamp()
        .setFooter({ text: `🔐 LOG RENDSZER • ${new Date().toLocaleString('hu-HU')}` });
    if (extraFields.length > 0) embed.addFields(extraFields);
    try { await webhook.send({ embeds: [embed] }); } catch (e) { console.error("Webhook hiba:", e.message); }
}
// =========================================================================

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

// Globális hibakezelő
process.on('unhandledRejection', error => {
    console.error('Nem várt hiba:', error);
    sendLog('error', '💥 **Unhandled Rejection**', [
        { name: '⚠️ Hiba', value: `\`\`\`${error.message}\`\`\``, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
});

client.once(Events.ClientReady, async (c) => {
    console.log(`Bejelentkezve: ${c.user.tag}`);

    // LOG: Bot indulás
    sendLog('success', '✅ **Bot élesítve - Render.com**', [
        { name: '🤖 Bot', value: `**${c.user.tag}**`, inline: true },
        { name: '🆔 ID', value: `\`${c.user.id}\``, inline: true },
        { name: '🏠 Szerver', value: `\`${GUILD_ID}\``, inline: true },
        { name: '🌐 URL', value: `${BASE_URL}`, inline: true },
        { name: '📦 Node', value: process.version, inline: true },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);

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

            // LOG: Már hitelesített próbálkozás
            if (interaction.member.roles.cache.has(ROLE_ID)) {
                sendLog('warning', '⚠️ **Már hitelesített user újrapróbálkozott**', [
                    { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                    { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true },
                    { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                ]);
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
            }

            // LOG: Gomb megnyomva
            sendLog('info', '🔍 **Szabályzat gomb megnyomva**', [
                { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true },
                { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ]);

            const token = uuidv4();
            tokens[token] = { userId: interaction.user.id, expires: Date.now() + 5 * 60 * 1000 };
            const link = `${BASE_URL}/verify/${token}`;

            // LOG: Token generálva
            sendLog('token', '🔑 **Token generálva**', [
                { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true },
                { name: '🔑 Token', value: `\`${token.slice(0, 12)}...\``, inline: true },
                { name: '⏳ Lejárat', value: '5 perc', inline: true },
                { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ]);

            const embed = new EmbedBuilder()
                .setTitle("Szabályzat Elfogadása")
                .setDescription(
                    `**Kattints az alábbi gombra a szabályzat megtekintéséhez és elfogadásához:**\n\n` +
                    `📘 **A gombra kattintva megnyílik a böngésződ**\n` +
                    `⏰ **A link 5 percig érvényes**\n\n` +
                    `*Ha nem nyílik meg automatikusan, másold be a linket a böngésződbe:*\n\`${link}\``
                )
                .setColor("#2b2d31");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("SZABÁLYZAT ELFOGADÁSA")
                    .setURL(link)
                    .setStyle(ButtonStyle.Link)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error("Gomb interakció hiba:", error);
            sendLog('error', '❌ **Gomb interakció hiba**', [
                { name: '👤 User', value: `${interaction.user?.tag || 'Ismeretlen'}`, inline: true },
                { name: '⚠️ Hiba', value: `\`\`\`${error.message}\`\`\``, inline: false },
                { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ]);
            if (interaction.deferred) {
                await interaction.editReply({ content: "Hiba történt a folyamat során." }).catch(() => {});
            }
        }
    }
});

// --- WEB SZERVER ---
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) {
        // LOG: Lejárt link
        sendLog('warning', '⏰ **Lejárt/érvénytelen link megnyitva**', [
            { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
            { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
            { name: '📱 User-Agent', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 80)}\``, inline: false },
            { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>A link lejárt vagy érvénytelen.</h2></body>");
    }

    // LOG: Oldal betöltve
    sendLog('request', '🌐 **Szabályzat oldal betöltve**', [
        { name: '👤 User ID', value: `\`${data.userId}\``, inline: true },
        { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
        { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
        { name: '📱 Böngésző', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 100)}\``, inline: false },
        { name: '🌐 Referer', value: `${req.headers.referer || 'Nincs'}`, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);

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

// Elfogadás végpont
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>Hiba: Érvénytelen vagy lejárt munkamenet.</h2></body>");

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        
        await member.roles.add([ROLE_ID, SECOND_ROLE_ID]);
        
        // LOG: Sikeres elfogadás
        sendLog('success', '✅ **Szabályzat ELFOGADVA - Rangok kiosztva**', [
            { name: '👤 Felhasználó', value: `**${member.user.tag}**`, inline: true },
            { name: '🆔 ID', value: `\`${member.user.id}\``, inline: true },
            { name: '🎭 Rang 1', value: `<@&${ROLE_ID}>`, inline: true },
            { name: '🎭 Rang 2', value: `<@&${SECOND_ROLE_ID}>`, inline: true },
            { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
            { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
            { name: '📱 User-Agent', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 100)}\``, inline: false },
            { name: '📅 Elfogadva', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        
        await member.send("✅ **Sikeresen elfogadtad a szabályzatot!**\nKöszönjük a jelentkezésedet, jó szórakozást a szerveren!").catch(() => {
            console.log(`${member.user.tag} lezárt DM-ekkel rendelkezik.`);
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
        // LOG: Elfogadás hiba
        sendLog('error', '❌ **Szabályzat elfogadás HIBA**', [
            { name: '👤 User ID', value: `\`${data.userId || 'Ismeretlen'}\``, inline: true },
            { name: '⚠️ Hiba', value: `\`\`\`${e.message}\`\`\``, inline: false },
            { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        res.send("<body style='background:#0f111a;color:#e53935;text-align:center;margin-top:50px;'><h2>Hiba történt a rang kiosztása közben. Kérlek jelezd egy adminnak!</h2></body>");
    }
});

// Elutasítás végpont
app.post('/decline/:token', (req, res) => {
    const data = tokens[req.params.token];
    
    // LOG: Elutasítás
    sendLog('warning', '❌ **Szabályzat ELUTASÍTVA**', [
        { name: '👤 User ID', value: `\`${data?.userId || 'Ismeretlen'}\``, inline: true },
        { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
        { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
        { name: '📱 User-Agent', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 100)}\``, inline: false },
        { name: '📅 Elutasítva', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);

    delete tokens[req.params.token];

    res.send(`
    <html lang="hu">
    <head>
        <meta charset="UTF-8">
        <title>Elutasítva</title>
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{
            min-height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            overflow:hidden;
            font-family:'Inter',sans-serif;
            background: radial-gradient(circle at top left,#2563eb 0%,transparent 30%),
                        radial-gradient(circle at bottom right,#7c3aed 0%,transparent 30%),
                        linear-gradient(135deg,#020617,#0f172a);
            color:white;
        }
        .card{
            width:95%;
            max-width:650px;
            padding:60px;
            border-radius:35px;
            background:rgba(15,23,42,0.72);
            border:1px solid rgba(255,255,255,0.08);
            backdrop-filter:blur(22px);
            text-align:center;
        }
        h2{ font-size:42px; margin-bottom:20px; }
        p{ color:#cbd5e1; line-height:1.8; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Szabályzat elutasítva</h2>
            <p>
                Nem fogadtad el a szabályzatot,
                ezért nem kaptál hozzáférést a szerverhez.
            </p>
        </div>
    </body>
    </html>
    `);
});

// =========================
// WEBSERVER
// =========================

app.listen(PORT, '0.0.0.0', () => {
    console.log("✅ Webserver fut a porton:", PORT);
    sendLog('system', '🌍 **Webserver elindult**', [
        { name: '🔌 Port', value: `\`${PORT}\``, inline: true },
        { name: '🔗 URL', value: `${BASE_URL}`, inline: true },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
});

// =========================
// DISCORD LOGIN
// =========================

client.login(TOKEN).catch(err => {
    console.error("❌ Discord login hiba:", err);
    sendLog('error', '❌ **Discord login HIBA**', [
        { name: '⚠️ Hiba', value: `\`\`\`${err.message}\`\`\``, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
});

// =========================
// HIBÁK ÉS STABILITÁS
// =========================

client.on('error', (err) => {
    console.error('❌ DISCORD ERROR:', err);
    sendLog('error', '❌ **Discord hiba**', [
        { name: '⚠️ Hiba', value: `\`\`\`${err.message}\`\`\``, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
});

client.on('shardError', (err) => {
    console.error('❌ SHARD ERROR:', err);
    sendLog('error', '❌ **Shard hiba**', [
        { name: '⚠️ Hiba', value: `\`\`\`${err.message}\`\`\``, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
});

// Keep alive
setInterval(() => {
    console.log(`🟢 BOT ONLINE | ${new Date().toLocaleString()}`);
    
    sendLog('system', '💚 **Bot heartbeat - Online**', [
        { name: '🤖 Bot', value: `**${client.user?.tag || 'Ismeretlen'}**`, inline: true },
        { name: '🆔 ID', value: `\`${client.user?.id || '?'}\``, inline: true },
        { name: '🔄 Uptime', value: `${Math.floor(process.uptime() / 60)} perc`, inline: true },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
}, 60000);

// RAM monitor
setInterval(() => {
    const used = process.memoryUsage();
    const rssMB = (used.rss / 1024 / 1024).toFixed(2);
    const heapMB = (used.heapUsed / 1024 / 1024).toFixed(2);

    console.log(`
========================
RAM USAGE
rss: ${rssMB} MB
heapUsed: ${heapMB} MB
========================
`);

    let color = 'success';
    let status = '🟢';
    if (rssMB > 200) { color = 'warning'; status = '🟡'; }
    if (rssMB > 400) { color = 'danger'; status = '🔴'; }

    sendLog(color, `${status} **RAM használat**`, [
        { name: '💾 RSS', value: `\`${rssMB} MB\``, inline: true },
        { name: '🧠 Heap used', value: `\`${heapMB} MB\``, inline: true },
        { name: '📊 Heap total', value: `\`${(used.heapTotal / 1024 / 1024).toFixed(2)} MB\``, inline: true },
        { name: '🔄 Uptime', value: `${Math.floor(process.uptime() / 60)} perc`, inline: true },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);
}, 300000);
