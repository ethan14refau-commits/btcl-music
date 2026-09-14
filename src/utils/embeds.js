'use strict';

const { EmbedBuilder } = require('discord.js');

const COLOR = 0x0d0d0d; // near black
const COLOR_ERR = 0x2b0000;
const COLOR_SUCCESS = 0x0d1f0d;

function nowPlayingEmbed(track, queue) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('👑 BTCL MUSIC')
    .setDescription('🎵 **Lecture en cours**')
    .setThumbnail(track.thumbnail)
    .addFields(
      { name: '🎶 Titre', value: track.title, inline: false },
      { name: '👤 Demandé par', value: `<@${track.requestedBy}>`, inline: true },
      { name: '⏱️ Durée', value: track.duration, inline: true },
      { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
      { name: '🔁 Loop', value: queue.loop ? 'Activé' : 'Désactivé', inline: true },
      { name: '📋 En attente', value: `${queue.tracks.length} musique(s)`, inline: true },
    )
    .setFooter({ text: '🖤 BTCL Music' })
    .setTimestamp();
}

function queueEmbed(queue) {
  const lines = queue.tracks.map((t, i) =>
    `**${i + 1}.** ${t.title} — \`${t.duration}\` — <@${t.requestedBy}>`
  );

  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('👑 File d\'attente BTCL')
    .setDescription(
      queue.current
        ? `🎵 **En cours :** ${queue.current.title}\n\n${lines.length > 0 ? lines.join('\n') : '*File vide*'}`
        : lines.length > 0 ? lines.join('\n') : '*File vide*'
    )
    .setFooter({ text: `🖤 ${queue.tracks.length} musique(s) en attente` })
    .setTimestamp();
}

function successEmbed(text) {
  return new EmbedBuilder().setColor(COLOR_SUCCESS).setDescription(`✅ ${text}`);
}

function errorEmbed(text) {
  return new EmbedBuilder().setColor(COLOR_ERR).setDescription(`❌ ${text}`);
}

function addedEmbed(track, position) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('🖤 BTCL Music — Ajouté')
    .setThumbnail(track.thumbnail)
    .addFields(
      { name: '🎵 Titre', value: track.title, inline: false },
      { name: '⏱️ Durée', value: track.duration, inline: true },
      { name: '📋 Position', value: `#${position}`, inline: true },
    )
    .setFooter({ text: '🖤 BTCL Music' });
}

function helpEmbed(prefix) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle('👑 BTCL Music — Commandes')
    .addFields(
      { name: `\`${prefix}play <titre ou URL>\``, value: 'Recherche et joue une musique YouTube', inline: false },
      { name: `\`${prefix}pause\``, value: 'Met en pause', inline: true },
      { name: `\`${prefix}resume\``, value: 'Reprend la lecture', inline: true },
      { name: `\`${prefix}skip\``, value: 'Passe à la suivante', inline: true },
      { name: `\`${prefix}stop\``, value: 'Arrête et déconnecte', inline: true },
      { name: `\`${prefix}queue\``, value: 'Affiche la file d\'attente', inline: true },
      { name: `\`${prefix}nowplaying\``, value: 'Musique en cours', inline: true },
      { name: `\`${prefix}volume <0-100>\``, value: 'Règle le volume', inline: true },
      { name: `\`${prefix}loop\``, value: 'Active/désactive la répétition', inline: true },
      { name: `\`${prefix}shuffle\``, value: 'Mélange la file', inline: true },
      { name: `\`${prefix}clear\``, value: 'Vide la file d\'attente', inline: true },
    )
    .setFooter({ text: '🖤 BTCL Music' });
}

module.exports = { nowPlayingEmbed, queueEmbed, successEmbed, errorEmbed, addedEmbed, helpEmbed };
