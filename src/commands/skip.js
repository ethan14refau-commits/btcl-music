'use strict';

const { getQueue } = require('../music/Queue');
const { playNext } = require('../music/player');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  async execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.current) {
      return message.reply({ embeds: [errorEmbed('Aucune musique en cours.')] });
    }
    const skipped = queue.current.title;
    queue.loop = false; // disable loop so it actually skips
    queue.player?.stop();
    message.reply({ embeds: [successEmbed(`⏭️ Skipped : **${skipped}**`)] });
  },
};
