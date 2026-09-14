'use strict';

const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
  entersState,
  joinVoiceChannel,
} = require('@discordjs/voice');
const { getStream } = require('./youtube');
const { getQueue, deleteQueue } = require('./Queue');
const { nowPlayingEmbed, errorEmbed } = require('../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const AUTO_LEAVE_MS = 60_000;

async function joinChannel(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  console.log('[Voice] Joining', voiceChannel.name, '— state:', connection.state.status);

  // Log every state change
  connection.on('stateChange', (oldState, newState) => {
    console.log(`[Voice] ${oldState.status} -> ${newState.status}`);
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log('[Voice] ✅ Ready!');
  } catch (err) {
    console.error('[Voice] Failed to reach Ready. Last state:', connection.state.status);
    console.error('[Voice] Error:', err.message);
    connection.destroy();
    throw new Error('Impossible de rejoindre le salon vocal. Vérifie les permissions.');
  }

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      connection.destroy();
    }
  });

  return connection;
}

async function playNext(guildId) {
  const queue = getQueue(guildId);
  if (!queue.connection) return;

  if (queue.tracks.length === 0 && !queue.loop) {
    queue.current = null;
    startAutoLeave(guildId, queue);
    return;
  }

  if (queue.loop && queue.current) {
    queue.tracks.unshift(queue.current);
  }

  const track = queue.tracks.shift();
  queue.current = track;

  try {
    console.log('[Player] Playing:', track.title);
    const rawStream = await getStream(track.url);

    const resource = createAudioResource(rawStream, {
      inputType: StreamType.Raw,
      inlineVolume: true,
    });
    resource.volume?.setVolume(queue.volume / 100);

    if (!queue.player) {
      queue.player = createAudioPlayer();
      queue.connection.subscribe(queue.player);

      queue.player.on(AudioPlayerStatus.Idle, () => {
        playNext(guildId).catch(console.error);
      });

      queue.player.on('error', (err) => {
        console.error('[Player] Error:', err.message);
        queue.textChannel?.send({ embeds: [errorEmbed(`Erreur : ${err.message}`)] }).catch(() => {});
        playNext(guildId).catch(console.error);
      });
    }

    queue.player.play(resource);

    if (queue.autoLeaveTimer) {
      clearTimeout(queue.autoLeaveTimer);
      queue.autoLeaveTimer = null;
    }

    if (queue.textChannel) {
      const embed = nowPlayingEmbed(track, queue);
      const buttons = buildButtons(queue.loop);
      await queue.textChannel.send({ embeds: [embed], components: [buttons] }).catch(() => {});
    }

  } catch (err) {
    console.error('[Player] Failed:', err.message);
    queue.textChannel?.send({ embeds: [errorEmbed(`Impossible de lire **${track.title}**.\n${err.message}`)] }).catch(() => {});
    playNext(guildId).catch(console.error);
  }
}

function stopPlayer(guildId) {
  const queue = getQueue(guildId);
  queue.tracks = [];
  queue.current = null;
  queue.loop = false;

  if (queue.player) { queue.player.stop(true); queue.player = null; }
  if (queue.connection) { queue.connection.destroy(); queue.connection = null; }
  if (queue.autoLeaveTimer) { clearTimeout(queue.autoLeaveTimer); queue.autoLeaveTimer = null; }

  deleteQueue(guildId);
}

function startAutoLeave(guildId, queue) {
  if (queue.autoLeaveTimer) clearTimeout(queue.autoLeaveTimer);
  queue.autoLeaveTimer = setTimeout(() => {
    queue.textChannel?.send({ embeds: [{ description: '👋 File vide — déconnexion.', color: 0x1a1a1a }] }).catch(() => {});
    stopPlayer(guildId);
  }, AUTO_LEAVE_MS);
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

module.exports = { joinChannel, playNext, stopPlayer, buildButtons };
