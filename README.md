# 👑 BTCL Music Bot

Bot Discord musique pour le serveur BTCL.

## Installation

1. **Installe Node.js** → https://nodejs.org (LTS)

2. **Crée un bot Discord**
   - https://discord.com/developers/applications
   - New Application → Bot → Add Bot
   - Active **Message Content Intent** + **Server Members Intent**
   - Copie le token

3. **Configure le `.env`**
```
cp .env.example .env
```
Remplis `DISCORD_TOKEN` avec ton token.

4. **Installe les dépendances**
```
cd btcl-music
npm install
```

5. **Lance le bot**
```
npm start
```

## Commandes

| Commande | Description |
|---|---|
| `+play <titre>` | Joue une musique YouTube |
| `+pause` | Met en pause |
| `+resume` | Reprend la lecture |
| `+skip` | Passe à la suivante |
| `+stop` | Arrête et déconnecte |
| `+queue` | Affiche la file |
| `+nowplaying` | Musique en cours |
| `+volume <0-100>` | Règle le volume |
| `+loop` | Active/désactive la répétition |
| `+shuffle` | Mélange la file |
| `+clear` | Vide la file |
| `+help` | Liste des commandes |

## Permissions bot requises

- View Channels
- Send Messages
- Embed Links
- Connect
- Speak
