'use strict';

const { getQueue } = require('../music/Queue');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  name: 'resume',
  execute(message) {
    const queue = getQueue(message.guild.id);
    if (!queue.player || !queue.current) {
      return message.reply({ embeds: [errorEmbed('Aucune musique en cours.')] });
    }
    if (queue.player.state.status === AudioPlayerStatus.Playing) {
      return message.reply({ embeds: [errorEmbed('La musique est déjà en lecture.')] });
    }
    queue.player.unpause();
    message.reply({ embeds: [successEmbed('Lecture reprise.')] });
  },
};
