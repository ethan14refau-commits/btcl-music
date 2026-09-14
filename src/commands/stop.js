'use strict';

const { stopPlayer } = require('../music/player');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const { getQueue } = require('../music/Queue');

module.exports = {
  name: 'stop',
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.connection && !queue.current) {
      return message.reply({ embeds: [errorEmbed('Le bot n\'est pas dans un salon vocal.')] });
    }
    stopPlayer(message.guild.id);
    message.reply({ embeds: [successEmbed('⏹️ Musique arrêtée et file vidée.')] });
  },
};
