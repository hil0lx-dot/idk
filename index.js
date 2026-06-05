require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');

// RAILWAY HEALTH CHECK PORT
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Railway Core Cluster Online\n');
}).listen(PORT);

const BOSS_NAME = 'Zzynox_'; 
const SERVER_HOST = process.env.SERVER_HOST || 'maghrebsmp.fun';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '25565', 10);

const accounts = [];
if (process.env.BOT_1_USER && process.env.BOT_1_PASS) accounts.push({ username: process.env.BOT_1_USER, password: process.env.BOT_1_PASS });
if (process.env.BOT_2_USER && process.env.BOT_2_PASS) accounts.push({ username: process.env.BOT_2_USER, password: process.env.BOT_2_PASS });
if (process.env.BOT_3_USER && process.env.BOT_3_PASS) accounts.push({ username: process.env.BOT_3_USER, password: process.env.BOT_3_PASS });

function spawnNativeBot(account) {
  const botOptions = {
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: account.username,
    auth: 'offline',
    version: '1.20.4',
    viewDistance: 'tiny',
    physicsEnabled: true,
    plugins: { sentiments: false, sound: false, particle: false }
  };

  console.log(`[${account.username}] Launching direct connection loop via Railway...`);
  const bot = mineflayer.createBot(botOptions);
  bot.isTeleporting = false;
  let tpaLoop = null;

  bot.once('spawn', () => {
    console.log(`[${account.username}] Connected! Spawned into server proxy lobby.`);
    
    setTimeout(() => {
      bot.chat(`/login ${account.password}`);
      setTimeout(() => {
        bot.chat('/maghrebsmp');
        
        tpaLoop = setInterval(() => {
          if (!bot.isTeleporting) {
            // Self-contained logic handles triggers safely
          }
        }, 6000);
      }, 4000);
    }, 4000);
  });

  // 🔒 STRICT CHAT PROTECTION FILTER (Public/Private Messages)
  bot.on('chat', (username, message) => {
    if (username.toLowerCase() !== BOSS_NAME.toLowerCase()) return;

    const cleanMsg = message.trim().toLowerCase();
    
    if (cleanMsg === '!tpa') {
      console.log(`[${account.username}] Processing authorized !tpa request from ${BOSS_NAME}`);
      bot.chat(`/tpa ${BOSS_NAME}`);
    }
    if (cleanMsg === '!accept') {
      console.log(`[${account.username}] Processing authorized !accept from ${BOSS_NAME}`);
      bot.chat('/tpaccept');
    }
  });

  // 🔒 ANTI-TRAP SYSTEM MESSAGE DETECTION
  bot.on('message', (jsonMsg) => {
    const line = jsonMsg.toString();
    const lowerLine = line.toLowerCase();

    const isTpaRequest = lowerLine.includes('has requested to teleport') || lowerLine.includes('wants to teleport');
    
    if (isTpaRequest) {
      // 🚨 CRITICAL CHECK: Block rogue tpahere requests
      // Most servers format it as: "User has requested you to teleport to them" or contains "tpahere"
      const isTpaHere = lowerLine.includes('to them') || lowerLine.includes('tpahere') || lowerLine.includes('teleport to you');
      
      // If your name initiated it AND it's a standard TPA (not a tpahere trap)
      if (lowerLine.includes(BOSS_NAME.toLowerCase()) && !isTpaHere) {
        console.log(`[${account.username}] Valid incoming standard TPA verified from owner. Accepting...`);
        bot.chat('/tpaccept');
      } else {
        // If it's a tpahere trap OR from a random person, drop it completely
        console.log(`[${account.username}] BLOCK: Denied unauthorized TPA/TPAHere request from chat streams.`);
      }
    }

    if (lowerLine.includes('teleporting') || lowerLine.includes('accepted')) {
      bot.isTeleporting = true;
      setTimeout(() => { bot.isTeleporting = false; }, 8000);
    }
  });

  bot.on('end', (reason) => {
    if (tpaLoop) clearInterval(tpaLoop);
    console.log(`[${account.username}] Connection broken (${reason}). Reconnecting in 45s...`);
    setTimeout(() => spawnNativeBot(account), 45000);
  });

  bot.on('error', (err) => {
    if (err.code !== 'ECONNRESET') {
      console.error(`[${account.username}] Network Line Error:`, err.message);
    }
  });
}

if (accounts.length > 0) {
  console.log(`[ClusterManager] Initializing ${accounts.length} locked-down native cloud nodes...`);
  accounts.forEach((acc, i) => {
    setTimeout(() => spawnNativeBot(acc), i * 20000);
  });
} else {
  console.error("[ClusterManager] Setup Error: No accounts found inside Railway Variables.");
    }
