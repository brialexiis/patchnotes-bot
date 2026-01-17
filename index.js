const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const translate = require('@vitalets/google-translate-api');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CANAL_ORIGEN = process.env.CANAL_ORIGEN;
const CANAL_DESTINO = process.env.CANAL_DESTINO;

async function traducir(texto) {
  if (!texto) return null;
  try {
    const res = await axios.post("https://libretranslate.de/translate", {
      q: texto,
      source: "en",
      target: "es",
      format: "text"
    });
    return res.data.translatedText;
  } catch {
    return texto;
  }
}

client.on("messageCreate", async (message) => {
  if (message.channelId !== CANAL_ORIGEN) return;
  if (!message.embeds.length) return;

  const e = message.embeds[0];

  const embed = new EmbedBuilder()
    .setColor(e.color || 0x00ff99)
    .setTitle(await traducir(e.title))
    .setDescription(await traducir(e.description));

  for (const f of e.fields) {
    embed.addFields({
      name: await traducir(f.name),
      value: await traducir(f.value),
      inline: f.inline
    });
  }

  if (e.image) embed.setImage(e.image.url);
  if (e.thumbnail) embed.setThumbnail(e.thumbnail.url);

  const canal = await client.channels.fetch(CANAL_DESTINO);
  canal.send({ embeds: [embed] });
});

client.login(TOKEN);
