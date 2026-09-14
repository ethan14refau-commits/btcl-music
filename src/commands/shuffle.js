'use strict';

const { getQueue } = require('../music/Queue');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'shuffle',
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (queue.tracks.length < 2) {
      return message.reply({ embeds: [errorEmbed('Pas assez de musiques dans la file pour mélanger.')] });
    }
    // Fisher-Yates shuffle
    for (let i = queue.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
    }
    message.reply({ embeds: [successEmbed(`🔀 File d'attente mélangée (${queue.tracks.length} musiques).`)] });
  },
};
