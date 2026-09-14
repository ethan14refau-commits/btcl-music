'use strict';

const { getQueue } = require('../music/Queue');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'pause',
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.player || !queue.current) {
      return message.reply({ embeds: [errorEmbed('Aucune musique en cours.')] });
    }
    if (queue.player.state.status === AudioPlayerStatus.Paused) {
      return message.reply({ embeds: [errorEmbed('La musique est déjà en pause.')] });
    }
    queue.player.pause();
    message.reply({ embeds: [successEmbed('Musique mise en pause.')] });
  },
};
