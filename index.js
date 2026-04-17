const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
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

client.once(Events.ClientReady, (c) => { console.log(`Bejelentkezve: ${c.user.tag}`); });

// WEB OLDAL (Hóesés effektel)
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("A link lejárt.");

    res.send(`
    <html>
    <head>
        <title>Szabályzat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                background: #000; color: white; 
                font-family: sans-serif; 
                display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
                overflow: hidden; /* Hogy a hópehely ne lógjon ki */
            }
            .card { 
                background: #11141d; width: 90%; max-width: 450px; 
                border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.7);
                border: 1px solid #222; position: relative; z-index: 10;
            }
            .header { background: linear-gradient(to bottom, #1d2538, #11141d); padding: 30px; text-align: center; border-bottom: 1px solid #333;}
            .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; color: #fff;}
            .header p { margin: 10px 0 0; font-size: 13px; opacity: 0.7; }
            .content { padding: 30px; text-align: left; line-height: 1.6; font-size: 13px; color: #ccc; }
            .footer { padding: 20px; background: #0c0f16; text-align: center; display: flex; justify-content: center; gap: 15px; }
            .btn { padding: 12px 30px; border: none; font-size: 15px; cursor: pointer; border-radius: 25px; font-weight: bold; color: white; }
            .btn-accept { background: #28a745; }
            .btn-accept:hover { background: #218838; }
            .btn-deny { background: #dc3545; }
            .btn-deny:hover { background: #c82333; }

            /* --- HÓESÉS CSS --- */
            #snow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
            .snowflake { position: absolute; background-color: white; border-radius: 50%; opacity: 0.8; }
        </style>
    </head>
    <body>
        <div id="snow"></div> <div class="card">
            <div class="header">
                <h1>SZABÁLYZAT</h1>
                <p>Kérlek, fogadd el a feltételeket a belépéshez!</p>
            </div>
            <div class="content">
                Ahhoz, hogy hozzáférj minden csatornához, el kell fogadnod a szabályzatunkat.<br><br>
                <b>Fontos:</b> A szabályzat elolvasása kötelező, és a nem ismerete nem mentesít a felelősség alól.
            </div>
            <div class="footer">
                <form action="/accept/${req.params.token}" method="POST" style="margin:0;">
                    <button type="submit" class="btn btn-accept">Elfogadom</button>
                </form>
                <form action="/deny" method="GET" style="margin:0;">
                    <button type="submit" class="btn btn-deny">Nem fogadom el</button>
                </form>
            </div>
        </div>

        <script>
            // --- HÓESÉS JS ---
            function createSnowflake() {
                const snow = document.getElementById('snow');
                const snowflake = document.createElement('div');
                snowflake.classList.add('snowflake');

                // Véletlenszerű pozíció és méret
                snowflake.style.left = Math.random() * window.innerWidth + 'px';
                snowflake.style.width = Math.random() * 5 + 1 + 'px';
                snowflake.style.height = snowflake.style.width;

                // Véletlenszerű animáció időtartam és késleltetés
                snowflake.style.animationDuration = Math.random() * 3 + 2 + 's'; // 2-5 másodperc
                snowflake.style.animationDelay = Math.random() * 3 + 's';

                snow.appendChild(snowflake);

                // Eltávolítás az animáció után
                setTimeout(() => {
                    snowflake.remove();
                }, 5000); // 5 másodperc után töröljük
            }

            // Pelyhek létrehozása időzítve
            setInterval(createSnowflake, 100); // 0.1 másodpercenként

            // CSS Animáció definiálása JS-ben (mert a style tagben bonyolultabb)
            const styleTag = document.createElement('style');
            styleTag.textContent = '@keyframes fall { to { transform: translateY(' + window.innerHeight + 'px); } } .snowflake { animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; }';
            document.head.appendChild(styleTag);
        </script>
    </body>
    </html>
    `);
});

// A többi rész (Discord, accept/deny) változatlan maradt.
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) return res.send("Link lejárt.");
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        await member.roles.add(ROLE_ID);
        delete tokens[req.params.token];
        res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;'><h1>Sikeres!</h1><p>Visszatérhetsz Discordra.</p></body>");
    } catch (e) { res.send("Hiba történt."); }
});

app.get('/deny', (req, res) => {
    res.send("<body style='background:#000;color:white;text-align:center;padding-top:50px;'><h1>Sajnáljuk...</h1><p>Amennyiben nem fogadod el akkor nem fogsz tudni részt venni közzösségünkben!</p></body>");
});

app.listen(PORT, '0.0.0.0', () => { console.log("Web fut a porton:", PORT); });
client.login(TOKEN);
