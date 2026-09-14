'use strict';

/**
 * Represents one track in the queue.
 */
class Track {
  constructor({ title, url, thumbnail, duration, requestedBy }) {
    this.title = title;
    this.url = url;
    this.thumbnail = thumbnail || null;
    this.duration = duration || 'Inconnue';
    this.requestedBy = requestedBy;
  }
}

/**
 * Per-guild music queue and player state.
 */
class GuildQueue {
  constructor() {
    this.tracks = [];          // array of Track
    this.current = null;       // Track currently playing
    this.connection = null;    // VoiceConnection
    this.player = null;        // AudioPlayer
    this.volume = 80;          // 0-100
    this.loop = false;         // loop current track
    this.textChannel = null;   // TextChannel for responses
    this.autoLeaveTimer = null;
  }
}

/**
 * Global queue manager — one GuildQueue per guild.
 */
const queues = new Map();

function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new GuildQueue());
  }
  return queues.get(guildId);
}

function deleteQueue(guildId) {
  queues.delete(guildId);
}

module.exports = { Track, GuildQueue, getQueue, deleteQueue };
