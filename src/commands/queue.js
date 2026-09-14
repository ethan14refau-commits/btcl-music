'use strict';

const { getQueue } = require('../music/Queue');
const { queueEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'queue',
  aliases: ['q'],
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.current && queue.tracks.length === 0) {
      return message.reply({ embeds: [errorEmbed('La file d\'attente est vide.')] });
    }
    message.reply({ embeds: [queueEmbed(queue)] });
  },
};
