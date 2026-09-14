'use strict';

const { getQueue } = require('../music/Queue');
const { playNext, stopPlayer, buildButtons } = require('../music/player');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const guildId = interaction.guild?.id;
    if (!guildId) return;

    const queue = getQueue(guildId);
    const id = interaction.customId;

    await interaction.deferUpdate().catch(() => {});

    if (id === 'music_pause') {
      if (!queue.player) return;
      if (queue.player.state.status === AudioPlayerStatus.Paused) {
        queue.player.unpause();
        interaction.followUp({ embeds: [successEmbed('▶️ Lecture reprise.')], ephemeral: true }).catch(() => {});
      } else {
        queue.player.pause();
        interaction.followUp({ embeds: [successEmbed('⏸️ Musique en pause.')], ephemeral: true }).catch(() => {});
      }
    }

    if (id === 'music_skip') {
      if (!queue.current) return;
      const title = queue.current.title;
      queue.loop = false;
      queue.player?.stop();
      interaction.followUp({ embeds: [successEmbed(`⏭️ Skipped : **${title}**`)], ephemeral: true }).catch(() => {});
    }

    if (id === 'music_shuffle') {
      if (queue.tracks.length < 2) return;
      for (let i = queue.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
      }
      interaction.followUp({ embeds: [successEmbed('🔀 File mélangée.')], ephemeral: true }).catch(() => {});
    }

    if (id === 'music_loop') {
      queue.loop = !queue.loop;
      // Update the button row
      try {
        await interaction.editReply({ components: [buildButtons(queue.loop)] });
      } catch { /* message may have been deleted */ }
      interaction.followUp({ embeds: [successEmbed(`🔁 Répétition **${queue.loop ? 'activée' : 'désactivée'}**.`)], ephemeral: true }).catch(() => {});
    }

    if (id === 'music_stop') {
      stopPlayer(guildId);
      interaction.followUp({ embeds: [successEmbed('⏹️ Musique arrêtée.')], ephemeral: true }).catch(() => {});
    }
  },
};
