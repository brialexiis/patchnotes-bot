const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

async function traducir(texto) {
  if (!texto) return texto;

  const limpio = String(texto).trim();
  if (limpio.length < 2) return texto;

  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: limpio,
        source: 'en',
        target: 'es',
        format: 'text'
      })
    });

    const data = await res.json();
    return data.translatedText || texto;
  } catch (e) {
    console.error('Error traduciendo:', e.message);
    return texto;
  }
}

client.on('messageCreate', async (message) => {
  // 🛑 Antiloop definitivo
  if (message.channelId === CANAL_DESTINO) return;
  if (message.author.id === client.user.id) return;

  if (message.channelId !== CANAL_ORIGEN) return;
  if (!message.embeds?.length) return;

  const canalDestino = await client.channels.fetch(CANAL_DESTINO);

  for (const e of message.embeds) {
    const embed = new EmbedBuilder();

    if (e.color) embed.setColor(e.color);

    if (e.title) {
      embed.setTitle(await traducir(String(e.title)));
    }

    if (e.description) {
      embed.setDescription(await traducir(String(e.description)));
    }

    if (e.fields?.length) {
      for (const f of e.fields) {
        embed.addFields({
          name: await traducir(String(f.name)),
          value: await traducir(String(f.value)),
          inline: f.inline ?? false
        });
      }
    }

    if (e.image?.url) embed.setImage(e.image.url);
    if (e.thumbnail?.url) embed.setThumbnail(e.thumbnail.url);

    if (e.footer?.text) {
      embed.setFooter({
        text: await traducir(String(e.footer.text))
      });
    }

    if (e.author?.name) {
      embed.setAuthor({
        name: await traducir(String(e.author.name)),
        iconURL: e.author.iconURL ?? undefined
      });
    }

    await canalDestino.send({ embeds: [embed] });
  }
});

client.login(DISCORD_TOKEN);
