const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Variables de entorno
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CANAL_ORIGEN = process.env.CANAL_ORIGEN;
const CANAL_DESTINO = process.env.CANAL_DESTINO;

// Función de traducción
async function traducir(texto) {
  if (!texto) return null;

  try {
    const res = await axios.post('https://libretranslate.de/translate', {
      q: texto,
      source: 'en',
      target: 'es',
      format: 'text'
    });

    return res.data.translatedText;
  } catch (err) {
    console.error('Error traduciendo:', err.message);
    return texto; // fallback
  }
}

// Evento principal
client.on('messageCreate', async (message) => {
  // Solo canal origen
  if (message.channelId !== CANAL_ORIGEN) return;

  // Solo mensajes con embeds
  if (!message.embeds || message.embeds.length === 0) return;

  const canalDestino = await client.channels.fetch(CANAL_DESTINO);
  const embedsTraducidos = [];

  for (const e of message.embeds) {
    const embed = new EmbedBuilder();

    if (e.color) embed.setColor(e.color);
    if (e.title) embed.setTitle(await traducir(e.title));
    if (e.description) embed.setDescription(await traducir(e.description));

    if (e.fields && e.fields.length > 0) {
      for (const f of e.fields) {
        embed.addFields({
          name: await traducir(f.name),
          value: await traducir(f.value),
          inline: f.inline ?? false
        });
      }
    }

    if (e.image?.url) embed.setImage(e.image.url);
    if (e.thumbnail?.url) embed.setThumbnail(e.thumbnail.url);
    if (e.footer?.text) {
      embed.setFooter({ text: await traducir(e.footer.text) });
    }
    if (e.author?.name) {
      embed.setAuthor({
        name: await traducir(e.author.name),
        iconURL: e.author.iconURL ?? null
      });
    }

    embedsTraducidos.push(embed);
  }

  if (embedsTraducidos.length > 0) {
    await canalDestino.send({ embeds: embedsTraducidos });
  }
});

// Login
client.login(DISCORD_TOKEN);
