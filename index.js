require('dotenv').config();
const mineflayer = require('mineflayer');
const http = require('http');

// RAILWAY HEALTH CHECK PORT (Keeps the service alive)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Railway Core Cluster Online\n');
}).listen(PORT);

const BOSS_NAME = 'Zzynox_'; 
const SERVER_HOST = process.env.SERVER_HOST || 'maghrebsmp.fun';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '25565', 10);

// Load accounts dynamically from Railway Variables
const accounts = [];
if (process.env.BOT_1_USER && process.env.BOT_1_PASS) {
  accounts.push({ username: process.env.BOT_1_USER, password: process.env.BOT_1_PASS });
}
if (process.env.BOT_2_USER && process.env.BOT_2_PASS) {
  accounts.push({ username: process.env.BOT_2_USER, password: process.env.BOT_2_PASS });
}
if (process.env.BOT_3_USER && process.env.BOT_3_PASS) {
  accounts.push({ username: process.env.BOT_3_USER, password: process.env.BOT_3_PASS });
}

function spawnNativeBot(account) {
  const botOptions = {
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: account.username,
    auth: 'offline',
    version: '1.20.4',
    viewDistance: 'tiny',
    physicsEnabled: true,
    // Turn off sound/particles to block custom packet terminal spam
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
          if (!bot.isTeleporting) bot.chat('/tpaccept');
        }, 6000);
      }, 4000);
    }, 4000);
  });

  bot.on('message', (jsonMsg) => {
    const line = jsonMsg.toString().toLowerCase();
    if (line.includes(BOSS_NAME.toLowerCase())) {
      if (line.includes('!tpa')) bot.chat(`/tpa ${BOSS_NAME}`);
      if (line.includes('!accept')) bot.chat('/tpaccept');
    }
    if (line.includes('teleporting') || line.includes('accepted')) {
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

// Stagger bot logins to avoid spam kicking
if (accounts.length > 0) {
  console.log(`[ClusterManager] Initializing ${accounts.length} native cloud nodes...`);
  accounts.forEach((acc, i) => {
    setTimeout(() => spawnNativeBot(acc), i * 20000);
  });
} else {
  console.error("[ClusterManager] Setup Error: No accounts found inside Railway Variables.");
}
