'use strict';

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const { ensureYtDlp } = require('./music/youtube');

const TOKEN = process.env.DISCORD_TOKEN;
const PREFIX = process.env.PREFIX || '+';

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN manquant dans .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// Load commands
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(join(__dirname, 'commands', file));
  client.commands.set(cmd.name, cmd);
  if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
}
console.log(`✅ ${client.commands.size} commandes chargées`);

// Load events
const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(join(__dirname, 'events', file));
  client.on(event.name, (...args) => event.execute(...args));
}

client.once('clientReady', async () => {
  console.log(`✅ ${client.user.tag} est en ligne !`);
  client.user.setActivity('.gg/btcl', { type: 1, url: 'https://www.twitch.tv/btcl' });
  try {
    await ensureYtDlp();
  } catch (err) {
    console.error('[yt-dlp] Download failed:', err.message);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, PREFIX);
  } catch (err) {
    console.error(`[Command: ${commandName}]`, err);
    message.reply({ embeds: [{ description: `❌ ${err.message}`, color: 0x2b0000 }] }).catch(() => {});
  }
});

process.on('unhandledRejection', (err) => console.error('[UnhandledRejection]', err));
process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  console.error('[UncaughtException]', err);
});

client.login(TOKEN).catch(err => {
  console.error('❌ Connexion impossible :', err.message);
  process.exit(1);
});
