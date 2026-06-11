const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

// ==========================================
// --- BEÁLLÍTÁSOK (IDE ÍRD BE AZ ADATOKAT) ---
// ==========================================
const GUILD_ID = '1512474765120634950';
const VERIFY_ROLE_ID = '1514714725487870063';
const LOG_CHANNEL_ID = '1514714585901563944';
const BASE_URL = 'https://discord-bot-xd16.onrender.com'; // Cseréld le a saját Render linkedre!
const PORT = process.env.PORT || 3000;
// A bot tokenjét a Render.com-on az "Environment Variables" fülön add meg BOT_TOKEN néven!
// ==========================================

// --- EXPRESS SZERVER ÉS HTML (0-24 Render.com-hoz) ---
const app = express();
app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
    res.send('A szerver online és fut!');
});

// A PRÉMIUM LILA-NEON ANIMÁLT HTML KÓD
const htmlContent = `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Verify - Szabályzat</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap');
        
        body { 
            margin: 0; padding: 0; 
            /* Sötét lila prémium háttér */
            background: radial-gradient(circle at center, #2e0249 0%, #0a0014 100%); 
            color: #f8fafc; 
            font-family: 'Poppins', sans-serif; 
            height: 100vh; 
            display: flex; justify-content: center; align-items: center; 
            overflow: hidden; 
        }
        
        /* Hóesés vászon */
        #snow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }

        /* Üveghatású fő panel - Lila neon beütéssel */
        .container { 
            position: relative; z-index: 1; 
            background: rgba(20, 0, 40, 0.4); 
            backdrop-filter: blur(16px); 
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(168, 85, 247, 0.3); 
            border-radius: 20px; 
            width: 90%; max-width: 800px; 
            display: flex; flex-direction: column; 
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.15), inset 0 0 20px rgba(168, 85, 247, 0.05); 
            animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
            opacity: 0; transform: translateY(50px); 
        }

        @keyframes slideUpFade { 
            to { opacity: 1; transform: translateY(0); } 
        }

        .header { 
            padding: 30px; text-align: center; 
            border-bottom: 1px solid rgba(168, 85, 247, 0.2); 
            background: linear-gradient(180deg, rgba(168, 85, 247, 0.1) 0%, transparent 100%);
            border-radius: 20px 20px 0 0;
        }
        .header h1 { 
            margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; 
            text-transform: uppercase;
            /* Neon szöveg effekt */
            color: #fff;
            text-shadow: 0 0 10px #a855f7, 0 0 20px #a855f7;
        }
        .header p { margin: 10px 0 0; font-size: 14px; color: #e9d5ff; font-weight: 300; letter-spacing: 1px; }

        .content { 
            padding: 30px 40px; 
            overflow-y: auto; max-height: 45vh; 
        }
        
        /* Gördítősáv formázása */
        .content::-webkit-scrollbar { width: 8px; } 
        .content::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 10px; } 
        .content::-webkit-scrollbar-thumb { background: #a855f7; border-radius: 10px; box-shadow: inset 0 0 6px rgba(0,0,0,0.3); }
        .content::-webkit-scrollbar-thumb:hover { background: #c084fc; }

        h2 { 
            font-size: 22px; color: #c084fc; 
            border-bottom: 2px solid rgba(168, 85, 247, 0.4); 
            padding-bottom: 10px; margin-top: 0; margin-bottom: 25px; 
            text-transform: uppercase; font-weight: 600; letter-spacing: 1px;
            text-shadow: 0 0 8px rgba(192, 132, 252, 0.5);
        }
        
        .rule { 
            background: rgba(255, 255, 255, 0.02); 
            border-left: 4px solid #a855f7; 
            padding: 15px 20px; margin-bottom: 15px; 
            border-radius: 0 10px 10px 0; 
            font-size: 14px; line-height: 1.7; color: #f3e8ff; 
            transition: all 0.3s ease; 
        }
        .rule:hover { 
            transform: translateX(10px); 
            background: rgba(168, 85, 247, 0.1); 
            border-left-color: #d8b4fe;
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.2);
        }

        .footer { 
            padding: 25px; display: flex; flex-direction: column; align-items: center; gap: 20px; 
            border-top: 1px solid rgba(168, 85, 247, 0.2); 
            background: rgba(10, 0, 20, 0.5); 
            border-radius: 0 0 20px 20px; 
        }
        
        .buttons {
            display: flex; gap: 20px; width: 100%; justify-content: center;
        }

        .btn { 
            padding: 12px 35px; border: 1px solid transparent; border-radius: 8px; 
            font-size: 16px; font-weight: 600; font-family: 'Poppins', sans-serif; 
            cursor: pointer; transition: all 0.3s ease; 
            position: relative; overflow: hidden; text-transform: uppercase; letter-spacing: 1px;
        }

        /* Zöld neon gomb */
        .btn-accept { 
            background: rgba(16, 185, 129, 0.1); color: #10b981; 
            border-color: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }
        .btn-accept:hover { 
            background: #10b981; color: #fff; 
            transform: translateY(-3px); box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); 
        }
        
        /* Piros neon gomb */
        .btn-decline { 
            background: rgba(239, 68, 68, 0.1); color: #ef4444; 
            border-color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
        }
        .btn-decline:hover { 
            background: #ef4444; color: #fff; 
            transform: translateY(-3px); box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); 
        }

        /* Tulajdonosi Copyright szöveg */
        .copyright {
            font-size: 12px;
            color: rgba(233, 213, 255, 0.4);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 10px;
        }
        
        .copyright span { color: #a855f7; font-weight: 600; }
    </style>
</head>
<body>
    <canvas id="snow"></canvas>
    
    <div class="container">
        <div class="header">
            <h1>SZABÁLYZATUNK</h1>
            <p>Kérlek olvasd el figyelmesen a folytatáshoz!</p>
        </div>
        <div class="content">
            <h2>Discord Szabályzat</h2>
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
            <div class="buttons">
                <button class="btn btn-accept" onclick="acceptRules()" id="acceptBtn">Elfogadom</button>
                <button class="btn btn-decline" onclick="declineRules()">Nem fogadom el</button>
            </div>
            <div class="copyright">Minden jog fenntartva ┃ Owner: <span>Arco</span></div>
        </div>
    </div>

    <script>
        // JS Prémium Hóesés Animáció
        const canvas = document.getElementById('snow');
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let snowflakes = [];

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        class Snowflake {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.radius = Math.random() * 2.5 + 0.5;
                this.speed = Math.random() * 1.5 + 0.5; 
                this.wind = Math.random() * 0.8 - 0.4;
                this.opacity = Math.random() * 0.6 + 0.2;
                this.glow = Math.random() * 5;
            }
            update() {
                this.y += this.speed;
                this.x += this.wind;
                if (this.y > height) {
                    this.y = 0;
                    this.x = Math.random() * width;
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = \`rgba(233, 213, 255, \${this.opacity})\`;
                ctx.shadowBlur = this.glow;
                ctx.shadowColor = '#a855f7';
                ctx.fill();
            }
        }

        // 120 hópehely generálása
        for (let i = 0; i < 120; i++) snowflakes.push(new Snowflake());

        function animateSnow() {
            ctx.clearRect(0, 0, width, height);
            snowflakes.forEach(flake => { flake.update(); flake.draw(); });
            requestAnimationFrame(animateSnow);
        }
        animateSnow();

        // API Logika
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('user');

        async function acceptRules() {
            if (!token || !userId) return alert('Hiba: Hiányzó vagy érvénytelen azonosító link!');
            
            const btn = document.getElementById('acceptBtn');
            btn.innerText = "KÉRLEK VÁRJ...";
            btn.style.opacity = "0.7";
            btn.style.pointerEvents = "none";

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
                    btn.innerText = "ELFOGADOM";
                    btn.style.opacity = "1";
                    btn.style.pointerEvents = "auto";
                }
            } catch (err) {
                alert('Szerverhiba történt.');
                btn.innerText = "ELFOGADOM";
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
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

app.get('/', (req, res) => {
    res.send(htmlContent);
});

const pendingVerifications = new Map();

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

        await member.roles.add(role);
        pendingVerifications.delete(userId);

        const dmEmbed = new EmbedBuilder()
            .setColor('#a855f7')
            .setAuthor({ name: 'Üdv Köztünk!' })
            .setDescription('Sikeresen elfogadtad a szabályzatot! Mostantól hozzáférsz az összes csatornához.')
            .setTimestamp();

        await member.send({ embeds: [dmEmbed] }).catch(() => console.log(`Nem tudtam DM-et küldeni neki: ${member.user.tag}`));

        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#a855f7')
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
            .setColor('#a855f7')
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
        if (interaction.member.roles.cache.has(VERIFY_ROLE_ID)) {
            return interaction.reply({
                content: 'Már elfogadtad a szabályzatot korábban!',
                ephemeral: true
            });
        }

        const token = crypto.randomBytes(16).toString('hex');
        const userId = interaction.user.id;
        
        pendingVerifications.set(userId, {
            token: token,
            expires: Date.now() + 5 * 60 * 1000
        });

        const verifyUrl = `${BASE_URL}/?token=${token}&user=${userId}`;
        const currentTime = Math.floor(Date.now() / 1000);

        const ephemeralEmbed = new EmbedBuilder()
            .setColor('#a855f7')
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
