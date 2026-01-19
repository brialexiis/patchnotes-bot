const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CANAL_ORIGEN = process.env.CANAL_ORIGEN;
const CANAL_DESTINO = process.env.CANAL_DESTINO;

// delay anti rate-limit
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function traducir(texto) {
  if (!texto || typeof texto !== 'string') return texto;

  try {
    const res = await axios.post('https://libretranslate.de/translate', {
      q: texto,
      source: 'auto',
      target: 'es',
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    await sleep(300); // evita que la API devuelva el mismo texto
    return res.data.translatedText || texto;
  } catch (e) {
    console.error('Error traducción:', e.message);
    return texto;
  }
}

client.on('messageCreate', async (message) => {
  // 🔴 CLAVE: evitar loop
  if (message.author.bot) return;

  if (message.channelId !== CANAL_ORIGEN) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const canalDestino = await client.channels.fetch(CANAL_DESTINO);
  const embedsFinales = [];

  for (const e of message.embeds) {
    const embed = new EmbedBuilder();

    if (e.color) embed.setColor(e.color);
    if (e.title) embed.setTitle(await traducir(e.title));
    if (e.description) embed.setDescription(await traducir(e.description));

    if (e.fields?.length) {
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
        iconURL: e.author.iconURL ?? undefined
      });
    }

    embedsFinales.push(embed);
  }

  if (embedsFinales.length) {
    await canalDestino.send({ embeds: embedsFinales });
  }
});

client.login(DISCORD_TOKEN);
