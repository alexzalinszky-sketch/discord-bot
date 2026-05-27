const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

// ==========================================
// --- BEÁLLÍTÁSOK (IDE ÍRD BE AZ ADATOKAT) ---
// ==========================================
const GUILD_ID = '1456263565278187653';
const VERIFY_ROLE_ID = '1508182881451638825';
const LOG_CHANNEL_ID = '1509169646639648798';
const BASE_URL = 'https://discord-bot-p8oi.onrender.com'; // Cseréld le a saját Render linkedre!
const PORT = process.env.PORT || 3000; // Ezt a Render automatikusan kezeli
// A bot tokenjét a Render.com-on az "Environment Variables" fülön add meg BOT_TOKEN néven!
// ==========================================

// --- EXPRESS SZERVER ÉS HTML (0-24 Render.com-hoz) ---
const app = express();
app.use(cors());
app.use(express.json());

// 0-24 ping végpont (UptimeRobot-nak)
app.get('/ping', (req, res) => {
    res.send('A szerver online és fut!');
});

// A weboldal HTML kódja
const htmlContent = `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Verify - Szabályzat</title>
    <style>
        body { margin: 0; padding: 0; background-color: #0b0f19; color: #ffffff; font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; background-image: radial-gradient(circle, #1a2035 0%, #0b0f19 100%); }
        .stars { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent url('https://cdn.pixabay.com/photo/2016/01/27/15/25/space-1164579_960_720.png') repeat; opacity: 0.3; z-index: 1; }
        .container { background-color: #111827; border-radius: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); width: 90%; max-width: 800px; z-index: 2; overflow: hidden; display: flex; flex-direction: column; border: 1px solid #1f2937; }
        .header { background: linear-gradient(to right, #1e3a8a, #2563eb); padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { margin: 5px 0 0 0; font-size: 14px; color: #bfdbfe; }
        .content { padding: 20px 30px; overflow-y: auto; max-height: 50vh; }
        .content h2 { border-left: 4px solid #3b82f6; padding-left: 10px; font-size: 18px; margin-bottom: 15px; }
        .rule { margin-bottom: 15px; font-size: 14px; line-height: 1.5; color: #d1d5db; }
        .footer { padding: 20px; display: flex; justify-content: center; gap: 20px; background-color: #111827; border-top: 1px solid #1f2937; }
        .btn { padding: 10px 25px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .btn-accept { background-color: #10b981; color: white; }
        .btn-accept:hover { background-color: #059669; }
        .btn-decline { background-color: #ef4444; color: white; }
        .btn-decline:hover { background-color: #dc2626; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
    </style>
</head>
<body>
    <div class="stars"></div>
    <div class="container">
        <div class="header">
            <h1>SZABÁLYZATUNK</h1>
            <p>Kérlek olvasd el figyelmesen!</p>
        </div>
        <div class="content">
            <h2>Discord Szabályzatunk</h2>
            <div class="rule">1. Légy tisztelettudó! Minden taggal kulturáltan és tiszteletteljesen kommunikálj. A sértegetés, gyűlölködés, bántalmazó viselkedés vagy bárminemű zaklatás szigorúan tilos.</div>
            <div class="rule">2. Nincs gyűlöletbeszéd vagy diszkrimináció! Tilos bármilyen rasszista, szexista, homofób, vallási vagy más sértő megnyilvánulás. Mindenkit egyenlően kezelünk.</div>
            <div class="rule">3. Tilos a spamelés és floodolás! Indokolatlan, ismétlődő üzenetek, karakterek, linkek vagy említések halmozása nem megengedett.</div>
            <div class="rule">4. Reklám és önpromóció csak engedéllyel! Más Discord szerverek, csatornák, oldalak vagy szolgáltatások hirdetése kizárólag az adminisztrátorok előzetes engedélyével engedélyezett.</div>
            <div class="rule">5. Tartsd be a csatornák témáját! Mindig az adott csatorna témájához kapcsolódj. Off-topic beszélgetések csak a kijelölt helyen folytathatók.</div>
            <div class="rule">6. Ne ossz meg személyes adatokat! Szigorúan tilos saját vagy más személyek adatait (név, cím, telefonszám, jelszó stb.) nyilvánosan megosztani.</div>
            <div class="rule">7. Tartalomkorlátozás! Tilos bármilyen 18+, erőszakos, jogsértő vagy illegális tartalom megosztása.</div>
            <div class="rule">8. Kövesd az adminok és moderátorok utasításait! A szabályok betartatása az ő feladatuk. A döntésüket tiszteletben kell tartani.</div>
            <div class="rule">9. Ne élj vissza a botokkal és funkciókkal! A botok és szerver funkciók szándékos túlterhelése, spammelése vagy szabotálása tilos.</div>
        </div>
        <div class="footer">
            <button class="btn btn-accept" onclick="acceptRules()">Elfogadom</button>
            <button class="btn btn-decline" onclick="declineRules()">Nem fogadom el</button>
        </div>
    </div>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('user');

        async function acceptRules() {
            if (!token || !userId) return alert('Hiba: Hiányzó vagy érvénytelen azonosító link!');
            try {
                const res = await fetch('/api/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, userId })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Sikeresen elfogadtad a szabályzatot! Bezárhatod az ablakot.');
                    window.close();
                } else {
                    alert('Hiba: ' + data.error);
                }
            } catch (err) {
                alert('Szerverhiba történt.');
            }
        }
        function declineRules() {
            alert('A hozzáféréshez el kell fogadnod a szabályzatot.');
            window.close();
        }
    </script>
</body>
</html>
`;

// Főoldal kiszolgálása
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// Memória a tokeneknek (5 percig élnek)
const pendingVerifications = new Map();

// API Endpoint a gombnyomásnak
app.post('/api/verify', async (req, res) => {
    const { token, userId } = req.body;

    if (!token || !userId) return res.status(400).json({ error: 'Hiányzó adatok!' });

    const verificationData = pendingVerifications.get(userId);

    if (!verificationData || verificationData.token !== token) {
        return res.status(403).json({ error: 'Érvénytelen vagy lejárt token!' });
    }

    if (Date.now() > verificationData.expires) {
        pendingVerifications.delete(userId);
        return res.status(403).json({ error: 'A link lejárt (5 perc)!' });
    }

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);
        const role = await guild.roles.fetch(VERIFY_ROLE_ID);

        // Rang megadása és token törlése
        await member.roles.add(role);
        pendingVerifications.delete(userId);

        // 1/1 DM üzenet küldése (Zöld oldalcsíkos embed)
        const dmEmbed = new EmbedBuilder()
            .setColor('#23a559')
            .setAuthor({ name: 'Üdv Köztünk!' })
            .setDescription('Sikeresen elfogadtad a szabályzatot! Mostantól hozzáférsz az összes csatornához.')
            .setTimestamp();

        await member.send({ embeds: [dmEmbed] }).catch(() => console.log(`Nem tudtam DM-et küldeni neki: ${member.user.tag}`));

        // Logolás a megadott csatornába
        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ name: 'Új Elfogadás', iconURL: member.user.displayAvatarURL() })
                .setDescription(`**${member.user.tag}** (<@${member.id}>) sikeresen elfogadta a szabályzatot és megkapta a rangot.`)
                .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Szerverhiba történt a rang megadásakor.' });
    }
});


// --- DISCORD BOT BEÁLLÍTÁSA ---
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Message, Partials.Channel]
});

client.once('ready', () => {
    console.log(`[BOT] Bejelentkezve mint ${client.user.tag}`);
    app.listen(PORT, () => {
        console.log(`[WEBSERVER] Fut a porton: ${PORT}`);
    });
});

client.on('messageCreate', async (message) => {
    if (message.content === '!szabalyzat-panel' && message.member.permissions.has('Administrator')) {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('Szabályzat')
            .setDescription(`Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.\n\n───────────────\n\n**Mit kapsz az elfogadás után:**\n➤ Teljes hozzáférés az összes csatornához\n\n**Fontos információk:**\n➤ A szabályzat elfogadása egyszeri művelet, multi account = kitiltás\n➤ Olvasd át figyelmesen, mert a nem ismerete nem mentesít\n\n───────────────`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_verify')
                .setLabel('Megtekintés')
                .setEmoji('🔎')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_verify') {
        // --- 1. ELLENŐRZÉS: Már elfogadta? ---
        if (interaction.member.roles.cache.has(VERIFY_ROLE_ID)) {
            return interaction.reply({
                content: 'Már elfogadtad a szabályzatot korábban!',
                ephemeral: true
            });
        }

        // --- 2. LINK GENERÁLÁSA (5 perces lejárattal) ---
        const token = crypto.randomBytes(16).toString('hex');
        const userId = interaction.user.id;
        
        pendingVerifications.set(userId, {
            token: token,
            expires: Date.now() + 5 * 60 * 1000 // Pontosan 5 perc
        });

        const verifyUrl = `${BASE_URL}/?token=${token}&user=${userId}`;
        const currentTime = Math.floor(Date.now() / 1000); // Discord timestamphez

        // 1/1 Ephemeral üzenet másolása
        const ephemeralEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('Szabályzat Elfogadása')
            .setDescription(`**Kattints az alábbi gombra a szabályzat megtekintéséhez és elfogadásához:**\n\n📱 **A gombra kattintva megnyílik a böngésződ**\n⏰ **A link 5 percig érvényes**\n\n*Ha nem nyílik meg automatikusan, másold be a linket a böngésződbe:*\n\`${verifyUrl}\`\n\nma <t:${currentTime}:t>-kor`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('SZABÁLYZAT ELFOGADÁSA')
                .setURL(verifyUrl)
                .setStyle(ButtonStyle.Link)
        );

        await interaction.reply({
            embeds: [ephemeralEmbed],
            components: [row],
            ephemeral: true
        });
    }
});

client.login(process.env.BOT_TOKEN);
