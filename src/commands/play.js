'use strict';

const { joinChannel, playNext } = require('../music/player');
const { searchYoutube } = require('../music/youtube');
const { getQueue, Track } = require('../music/Queue');
const { errorEmbed, addedEmbed } = require('../utils/embeds');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'play',
  aliases: ['p'],
  async execute(message, args) {
    if (!args.length) return message.reply({ embeds: [errorEmbed('Usage : `+play <titre ou URL YouTube>`')] });

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) return message.reply({ embeds: [errorEmbed('Tu dois être dans un salon vocal pour utiliser cette commande.')] });

    const perms = voiceChannel.permissionsFor(message.guild.members.me);
    if (!perms?.has(PermissionFlagsBits.Connect) || !perms?.has(PermissionFlagsBits.Speak)) {
      return message.reply({ embeds: [errorEmbed('Je n\'ai pas les permissions pour rejoindre ce salon vocal.')] });
    }

    const query = args.join(' ');
    const searching = await message.reply({ embeds: [{ description: `🔎 Recherche de **${query}**...`, color: 0x0d0d0d }] });

    const result = await searchYoutube(query);
    if (!result) {
      return searching.edit({ embeds: [errorEmbed('Aucune musique trouvée.')] });
    }

    const track = new Track({
      title: result.title,
      url: result.url,
      thumbnail: result.thumbnail,
      duration: result.duration,
      requestedBy: message.author.id,
    });

    const queue = getQueue(message.guild.id);
    queue.textChannel = message.channel;

    if (!queue.connection) {
      try {
        queue.connection = await joinChannel(voiceChannel);
      } catch (err) {
        await searching.delete().catch(() => {});
        return message.channel.send({ embeds: [errorEmbed(err.message)] });
      }
    }

    queue.tracks.push(track);
    await searching.delete().catch(() => {});

    if (!queue.current) {
      // Small delay to ensure voice connection is fully ready
      await new Promise(r => setTimeout(r, 500));
      await playNext(message.guild.id);
    } else {
      await message.channel.send({ embeds: [addedEmbed(track, queue.tracks.length)] });
    }
  },
};
