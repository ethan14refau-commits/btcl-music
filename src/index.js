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

const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(join(__dirname, 'commands', file));
  client.commands.set(cmd.name, cmd);
  if (cmd.aliases) cmd.aliases.forEach(a => client.commands.set(a, cmd));
}
console.log(`✅ ${client.commands.size} commandes chargées`);

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
    console.error(`[Command: ${commandName}]`, err.message);
    message.reply({ embeds: [{ description: `❌ ${err.message}`, color: 0x2b0000 }] }).catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { getQueue } = require('./music/Queue');
  const { stopPlayer, buildButtons } = require('./music/player');
  const { AudioPlayerStatus } = require('@discordjs/voice');
  const queue = getQueue(interaction.guild?.id);
  await interaction.deferUpdate().catch(() => {});
  try {
    if (!queue) return;
    if (interaction.customId === 'music_pause') {
      if (!queue.player) return;
      queue.player.state.status === AudioPlayerStatus.Paused ? queue.player.unpause() : queue.player.pause();
    }
    if (interaction.customId === 'music_skip') { queue.loop = false; queue.player?.stop(); }
    if (interaction.customId === 'music_shuffle') {
      for (let i = queue.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
      }
    }
    if (interaction.customId === 'music_loop') { queue.loop = !queue.loop; }
    if (interaction.customId === 'music_stop') { stopPlayer(interaction.guild.id); }
  } catch (err) {
    console.error('[Button]', err.message);
  }
});

process.on('unhandledRejection', (err) => console.error('[UnhandledRejection]', err?.message));
process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  console.error('[UncaughtException]', err.message);
});

client.login(TOKEN).catch(err => {
  console.error('❌ Connexion impossible :', err.message);
  process.exit(1);
});
