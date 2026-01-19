const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// fetch compatible con Node 18 (GitHub Actions)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

// 🔁 Traducción línea por línea (patch notes friendly)
async function traducir(texto) {
  if (!texto || typeof texto !== 'string') return texto;

  const lineas = texto.split('\n');
  const resultado = [];

  for (const linea of lineas) {
    if (linea.trim() === '') {
      resultado.push('');
      continue;
    }

    try {
      const res = await fetch('https://translate.argosopentech.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: linea,
          source: 'auto',
          target: 'es'
        })
      });

      const data = await res.json();
      resultado.push(data.translatedText || linea);
    } catch (e) {
      console.error('Error traducción:', e.message);
      resultado.push(linea);
    }
  }

  return resultado.join('\n');
}

client.on('messageCreate', async (message) => {
  // 🛑 Antiloop real (permite PathBot / webhooks)
  if (message.channelId === CANAL_DESTINO) return;
  if (message.author.id === client.user.id) return;

  if (message.channelId !== CANAL_ORIGEN) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const canalDestino = await client.channels.fetch(CANAL_DESTINO);
  const embedsTraducidos = [];

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

    embedsTraducidos.push(embed);
  }

  if (embedsTraducidos.length) {
    await canalDestino.send({ embeds: embedsTraducidos });
  }
});

client.login(DISCORD_TOKEN);
