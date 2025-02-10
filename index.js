const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

// ✅ استبدل هذه القيم بمعلوماتك
const BOT_TOKEN = '7612076019:AAFaXv3P2AgSQYdw2NTCZShFyTHhz_zK_z8';  // أدخل التوكن الخاص بالبوت
const OWNER_ID = 7661505696;       // أدخل معرف التليجرام الخاص بك

// ✅ تحميل المجموعات المسموح بها من ملف خارجي
const loadGroups = () => {
    if (fs.existsSync("groupes.txt")) {
        return new Set(fs.readFileSync("groupes.txt", "utf8").split("\n").map(line => parseInt(line)).filter(id => !isNaN(id)));
    }
    return new Set();
};

const saveGroups = () => {
    fs.writeFileSync("groupes.txt", Array.from(allowedGroups).join("\n"));
};

let allowedGroups = loadGroups();

// ✅ إنشاء البوت
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ✅ الأمر `/start`
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId === msg.from.id && msg.from.id === OWNER_ID) {
        bot.sendMessage(chatId, "✨ *Welcome to Likes Bot* ✨\n\n🔸 `/like <UID>` لإضافة الإعجابات\n⚡️ *طلب واحد لكل حساب*\n🎮 *استمتع!* 🎮", { parse_mode: "Markdown" });
    } else {
        bot.sendMessage(chatId, "❌ هذا البوت يعمل فقط في المجموعات المسموح بها أو مع المالك.");
    }
});

// ✅ الأمر `/like <UID>`
bot.onText(/\/like (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const uid = match[1];

    if (!allowedGroups.has(chatId) && chatId !== msg.from.id) {
        bot.sendMessage(chatId, "❌ هذا البوت لا يعمل هنا.");
        return;
    }

    const processingMsg = await bot.sendMessage(chatId, "⌛ معالجة الطلب...");
    
    try {
        const response = await axios.get(`https://ff-virusteam.vercel.app/likes?uid=${uid}&key=ApiVirusTeam`);
        const data = response.data;

        if (data.status === "☑") {
            const userData = data["UID Validated - API connected"] || {};
            const likesData = data["Likes details"] || {};

            const replyText = `✅ تم زيادة الإعجابات بنجاح لـ UID: ${userData.UID || uid}!\n\n`
                + `📛 *الاسم:* ${userData.Name || 'N/A'}\n`
                + `🏅 *المستوى:* ${userData.Level || 'N/A'}\n`
                + `👍 *الإعجابات قبل:* ${likesData["Likes Before CMD"] || 'N/A'}\n`
                + `👍 *الإعجابات بعد:* ${likesData["Likes After CMD"] || 'N/A'}`;

            bot.editMessageText(replyText, { chat_id: chatId, message_id: processingMsg.message_id, parse_mode: "Markdown" });
        } else {
            bot.editMessageText(`❌ ${data.vsteam || data.message || "حدث خطأ غير معروف."}`, { chat_id: chatId, message_id: processingMsg.message_id });
        }
    } catch (error) {
        bot.editMessageText(`❌ حدث خطأ أثناء الاتصال بـ API: ${error.message}`, { chat_id: chatId, message_id: processingMsg.message_id });
    }
});

// ✅ إضافة مجموعة `/addgroup <ID>`
bot.onText(/\/addgroup (\d+)/, (msg, match) => {
    if (msg.from.id !== OWNER_ID) {
        bot.sendMessage(msg.chat.id, "❌ لا يمكنك إضافة المجموعات لأنك لست المالك.");
        return;
    }
    
    const groupId = parseInt(match[1]);
    allowedGroups.add(groupId);
    saveGroups();
    bot.sendMessage(msg.chat.id, `✅ تمت إضافة المجموعة ${groupId} بنجاح.`);
});

// ✅ إزالة مجموعة `/removegroup <ID>`
bot.onText(/\/removegroup (\d+)/, (msg, match) => {
    if (msg.from.id !== OWNER_ID) {
        bot.sendMessage(msg.chat.id, "❌ لا يمكنك إزالة المجموعات لأنك لست المالك.");
        return;
    }

    const groupId = parseInt(match[1]);
    if (allowedGroups.has(groupId)) {
        allowedGroups.delete(groupId);
        saveGroups();
        bot.sendMessage(msg.chat.id, `✅ تمت إزالة المجموعة ${groupId} بنجاح.`);
    } else {
        bot.sendMessage(msg.chat.id, `❌ المجموعة ${groupId} غير موجودة في القائمة.`);
    }
});

// ✅ عرض المجموعات المسموح بها `/groups`
bot.onText(/\/groups/, (msg) => {
    if (msg.from.id !== OWNER_ID) {
        bot.sendMessage(msg.chat.id, "❌ لا يمكنك عرض المجموعات لأنك لست المالك.");
        return;
    }

    if (allowedGroups.size > 0) {
        bot.sendMessage(msg.chat.id, `✅ المجموعات المسموح بها:\n${Array.from(allowedGroups).join("\n")}`);
    } else {
        bot.sendMessage(msg.chat.id, "❌ لا توجد مجموعات مضافة بعد.");
    }
});

// ✅ تشغيل البوت
console.log("✅ البوت يعمل بنجاح!");
