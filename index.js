const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= ENV =================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CANAL_ORIGEN = process.env.CANAL_ORIGEN;
const CANAL_DESTINO = process.env.CANAL_DESTINO;

// Debug clave
console.log("TOKEN:", DISCORD_TOKEN ? "CARGADO" : "VACIO");

// ================= TRANSLATE =================
async function traducir(texto) {
  if (!texto || typeof texto !== "string") return null;

  try {
    const res = await axios.post("https://libretranslate.de/translate", {
      q: texto,
      source: "en",
      target: "es",
      format: "text"
    });

    return typeof res.data.translatedText === "string"
      ? res.data.translatedText
      : texto;
  } catch (err) {
    console.log("Error traduciendo, se usa original");
    return texto;
  }
}

// ================= LISTENER =================
client.on("messageCreate", async (message) => {
  try {
    if (message.channelId !== CANAL_ORIGEN) return;
    if (!message.embeds || message.embeds.length === 0) return;

    const canalDestino = await client.channels.fetch(CANAL_DESTINO);

    for (const e of message.embeds) {
      const embed = new EmbedBuilder();

      if (typeof e.color === "number") {
        embed.setColor(e.color);
      }

      if (e.title) {
        const titulo = await traducir(e.title);
        if (titulo) embed.setTitle(titulo);
      }

      if (e.description) {
        const desc = await traducir(e.description);
        if (desc) embed.setDescription(desc);
      }

      if (Array.isArray(e.fields)) {
        for (const f of e.fields) {
          const name = await traducir(f.name);
          const value = await traducir(f.value);

          if (name && value) {
            embed.addFields({
              name,
              value,
              inline: f.inline ?? false
            });
          }
        }
      }

      if (e.image?.url) embed.setImage(e.image.url);
      if (e.thumbnail?.url) embed.setThumbnail(e.thumbnail.url);

      if (e.footer?.text) {
        const footerText = await traducir(e.footer.text);
        if (footerText) {
          embed.setFooter({
            text: footerText,
            iconURL: e.footer.iconURL || null
          });
        }
      }

      if (e.author?.name) {
        const authorName = await traducir(e.author.name);
        if (authorName) {
          embed.setAuthor({
            name: authorName,
            iconURL: e.author.iconURL || null
          });
        }
      }

      await canalDestino.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error("Error procesando embed:", err);
  }
});

// ================= LOGIN =================
client.login(DISCORD_TOKEN);
