'use strict';

require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { Player, QueryType } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

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

const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
  },
});

player.extractors.loadMulti(DefaultExtractors).then(() => {
  console.log('✅ Extractors chargés');
}).catch(console.error);

const COLOR = 0x0d0d0d;
const COLOR_ERR = 0x2b0000;
const COLOR_OK = 0x0d1f0d;

function embed(desc, color = COLOR) {
  return new EmbedBuilder().setColor(color).setDescription(desc);
}

function buildButtons(loop = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_pause').setEmoji('⏯️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(loop ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
  );
}

player.events.on('playerStart', (queue, track) => {
  queue.metadata?.send({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('👑 BTCL MUSIC')
        .setDescription('🎵 **Lecture en cours**')
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: '🎶 Titre', value: track.title, inline: false },
          { name: '👤 Demandé par', value: track.requestedBy ? `<@${track.requestedBy.id}>` : 'Inconnu', inline: true },
          { name: '⏱️ Durée', value: track.duration, inline: true },
          { name: '📋 En attente', value: `${queue.tracks.size} musique(s)`, inline: true },
        )
        .setFooter({ text: '🖤 BTCL Music' })
        .setTimestamp(),
    ],
    components: [buildButtons(queue.repeatMode > 0)],
  }).catch(() => {});
});

player.events.on('audioTrackAdd', (queue, track) => {
  if (queue.isPlaying()) {
    queue.metadata?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('🖤 Ajouté à la file')
          .setThumbnail(track.thumbnail)
          .addFields(
            { name: '🎵 Titre', value: track.title, inline: false },
            { name: '⏱️ Durée', value: track.duration, inline: true },
            { name: '📋 Position', value: `#${queue.tracks.size}`, inline: true },
          )
          .setFooter({ text: '🖤 BTCL Music' }),
      ],
    }).catch(() => {});
  }
});

player.events.on('emptyQueue', (queue) => {
  queue.metadata?.send({ embeds: [embed('👋 File terminée.')] }).catch(() => {});
});

player.events.on('error', (queue, error) => {
  console.error('[Player Error]', error.message);
  queue.metadata?.send({ embeds: [embed(`❌ Erreur : ${error.message}`, COLOR_ERR)] }).catch(() => {});
});

player.events.on('playerError', (queue, error) => {
  console.error('[Player Error]', error.message);
  queue.metadata?.send({ embeds: [embed(`❌ Erreur de lecture : ${error.message}`, COLOR_ERR)] }).catch(() => {});
});

client.once('clientReady', () => {
  console.log(`✅ ${client.user.tag} est en ligne !`);
  client.user.setActivity('.gg/btcl', { type: 1, url: 'https://www.twitch.tv/btcl' });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  const voiceChannel = message.member?.voice?.channel;

  try {
    if (cmd === 'play' || cmd === 'p') {
      if (!args.length) return message.reply({ embeds: [embed('❌ Usage : `+play <titre ou URL>`', COLOR_ERR)] });
      if (!voiceChannel) return message.reply({ embeds: [embed('❌ Tu dois être dans un salon vocal.', COLOR_ERR)] });

      const query = args.join(' ');
      const searching = await message.reply({ embeds: [embed(`🔎 Recherche de **${query}**...`)] });

      const { track } = await player.play(voiceChannel, query, {
        nodeOptions: {
          metadata: message.channel,
          selfDeaf: true,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 60000,
        },
        requestedBy: message.author,
        searchEngine: QueryType.YOUTUBE_SEARCH,
      });

      await searching.delete().catch(() => {});
    }

    else if (cmd === 'pause') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue?.isPlaying()) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      queue.node.pause();
      message.reply({ embeds: [embed('⏸️ Pause.', COLOR_OK)] });
    }

    else if (cmd === 'resume' || cmd === 'r') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      queue.node.resume();
      message.reply({ embeds: [embed('▶️ Reprise.', COLOR_OK)] });
    }

    else if (cmd === 'skip' || cmd === 's') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue?.isPlaying()) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      queue.node.skip();
      message.reply({ embeds: [embed('⏭️ Suivante.', COLOR_OK)] });
    }

    else if (cmd === 'stop') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply({ embeds: [embed('❌ Rien à arrêter.', COLOR_ERR)] });
      queue.delete();
      message.reply({ embeds: [embed('⏹️ Arrêté.', COLOR_OK)] });
    }

    else if (cmd === 'queue' || cmd === 'q') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue?.currentTrack) return message.reply({ embeds: [embed('❌ File vide.', COLOR_ERR)] });
      const tracks = queue.tracks.toArray();
      const list = [`▶️ **${queue.currentTrack.title}**`, ...tracks.slice(0, 14).map((t, i) => `**${i + 1}.** ${t.title}`)].join('\n');
      message.reply({
        embeds: [new EmbedBuilder().setColor(COLOR).setTitle('👑 File d\'attente').setDescription(list).setFooter({ text: `🖤 ${tracks.length} en attente` })],
      });
    }

    else if (cmd === 'nowplaying' || cmd === 'np') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue?.currentTrack) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      const track = queue.currentTrack;
      message.reply({
        embeds: [new EmbedBuilder().setColor(COLOR).setTitle('👑 En cours').setThumbnail(track.thumbnail)
          .addFields({ name: '🎵', value: track.title }, { name: '⏱️', value: track.duration, inline: true }, { name: '🔊', value: `${queue.node.volume}%`, inline: true })
          .setFooter({ text: '🖤 BTCL Music' })],
        components: [buildButtons(queue.repeatMode > 0)],
      });
    }

    else if (cmd === 'volume' || cmd === 'vol') {
      const vol = parseInt(args[0]);
      if (isNaN(vol) || vol < 0 || vol > 100) return message.reply({ embeds: [embed('❌ `+volume <0-100>`', COLOR_ERR)] });
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      queue.node.setVolume(vol);
      message.reply({ embeds: [embed(`🔊 Volume : **${vol}%**`, COLOR_OK)] });
    }

    else if (cmd === 'loop') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply({ embeds: [embed('❌ Aucune musique.', COLOR_ERR)] });
      const { QueueRepeatMode } = require('discord-player');
      const mode = queue.repeatMode === QueueRepeatMode.OFF ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF;
      queue.setRepeatMode(mode);
      message.reply({ embeds: [embed(`🔁 **${mode !== QueueRepeatMode.OFF ? 'Activée' : 'Désactivée'}**`, COLOR_OK)] });
    }

    else if (cmd === 'shuffle') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue || queue.tracks.size < 2) return message.reply({ embeds: [embed('❌ Pas assez de musiques.', COLOR_ERR)] });
      queue.tracks.shuffle();
      message.reply({ embeds: [embed('🔀 File mélangée.', COLOR_OK)] });
    }

    else if (cmd === 'clear' || cmd === 'cq') {
      const queue = player.nodes.get(message.guild.id);
      if (!queue) return message.reply({ embeds: [embed('❌ File vide.', COLOR_ERR)] });
      queue.tracks.clear();
      message.reply({ embeds: [embed('🗑️ File vidée.', COLOR_OK)] });
    }

    else if (cmd === 'help' || cmd === 'h') {
      message.reply({
        embeds: [new EmbedBuilder().setColor(COLOR).setTitle('👑 BTCL Music')
          .addFields(
            { name: '`+play <titre>`', value: 'Joue une musique', inline: false },
            { name: '`+pause`', value: 'Pause', inline: true },
            { name: '`+resume`', value: 'Reprend', inline: true },
            { name: '`+skip`', value: 'Suivante', inline: true },
            { name: '`+stop`', value: 'Stop', inline: true },
            { name: '`+queue`', value: 'File', inline: true },
            { name: '`+np`', value: 'En cours', inline: true },
            { name: '`+volume <n>`', value: 'Volume', inline: true },
            { name: '`+loop`', value: 'Boucle', inline: true },
            { name: '`+shuffle`', value: 'Mélange', inline: true },
          ).setFooter({ text: '🖤 BTCL Music' })],
      });
    }

  } catch (err) {
    console.error(`[Command: ${cmd}]`, err.message);
    message.reply({ embeds: [embed(`❌ ${err.message}`, COLOR_ERR)] }).catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const queue = player.nodes.get(interaction.guild.id);
  await interaction.deferUpdate().catch(() => {});
  try {
    if (!queue) return;
    const { QueueRepeatMode } = require('discord-player');
    if (interaction.customId === 'music_pause') queue.node.isPaused() ? queue.node.resume() : queue.node.pause();
    if (interaction.customId === 'music_skip') queue.node.skip();
    if (interaction.customId === 'music_shuffle') queue.tracks.shuffle();
    if (interaction.customId === 'music_loop') queue.setRepeatMode(queue.repeatMode === QueueRepeatMode.OFF ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF);
    if (interaction.customId === 'music_stop') queue.delete();
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
