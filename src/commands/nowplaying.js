'use strict';

const { getQueue } = require('../music/Queue');
const { nowPlayingEmbed, buildButtons, errorEmbed } = require('../utils/embeds');
const { buildButtons: buildBtns } = require('../music/player');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.current) {
      return message.reply({ embeds: [errorEmbed('Aucune musique en cours.')] });
    }
    const buttons = buildBtns(queue.loop);
    message.reply({ embeds: [nowPlayingEmbed(queue.current, queue)], components: [buttons] });
  },
};
