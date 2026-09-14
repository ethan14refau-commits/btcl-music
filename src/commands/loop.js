'use strict';

const { getQueue } = require('../music/Queue');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'loop',
  aliases: ['repeat'],
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.current) {
      return message.reply({ embeds: [errorEmbed('Aucune musique en cours.')] });
    }
    queue.loop = !queue.loop;
    message.reply({ embeds: [successEmbed(`🔁 Répétition **${queue.loop ? 'activée' : 'désactivée'}**.`)] });
  },
};
