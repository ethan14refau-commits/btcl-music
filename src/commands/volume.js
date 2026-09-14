'use strict';

const { getQueue } = require('../music/Queue');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  execute(message, args) {
    const vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      return message.reply({ embeds: [errorEmbed('Usage : `+volume <0-100>`')] });
    }
    const queue = getQueue(message.guild.id);
    queue.volume = vol;

    // Apply to current resource if playing
    if (queue.player?.state?.status === AudioPlayerStatus.Playing) {
      const resource = queue.player.state.resource;
      resource?.volume?.setVolume(vol / 100);
    }

    message.reply({ embeds: [successEmbed(`🔊 Volume réglé sur **${vol}%**.`)] });
  },
};
