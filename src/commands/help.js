'use strict';

const { helpEmbed } = require('../utils/embeds');

module.exports = {
  name: 'help',
  aliases: ['h', 'commands'],
  execute(message, args, prefix) {
    message.reply({ embeds: [helpEmbed(prefix)] });
  },
};
