'use strict';

const { getQueue } = require('../music/Queue');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'clear',
  aliases: ['clearqueue', 'cq'],
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (queue.tracks.length === 0) {
      return message.reply({ embeds: [errorEmbed('La file d\'attente est déjà vide.')] });
    }
    const count = queue.tracks.length;
    queue.tracks = [];
    message.reply({ embeds: [successEmbed(`🗑️ ${count} musique(s) supprimée(s) de la file.`)] });
  },
};
