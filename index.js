const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Events, PermissionFlagsBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ]
});

// { messageId: { emoji: roleId } }
const reactionRoles = {};

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('setup-reaction')
      .setDescription('Cria uma mensagem de reaction roles')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(o => o.setName('titulo').setDescription('Título do embed').setRequired(true))
      .addStringOption(o => o.setName('descricao').setDescription('Descrição do embed').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji da reação (ex: 🎖️)').setRequired(true))
      .addRoleOption(o => o.setName('cargo').setDescription('Cargo que será dado').setRequired(true)),

    new SlashCommandBuilder()
      .setName('add-reaction')
      .setDescription('Adiciona emoji/cargo a uma mensagem existente')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(o => o.setName('mensagem_id').setDescription('ID da mensagem').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji da reação').setRequired(true))
      .addRoleOption(o => o.setName('cargo').setDescription('Cargo que será dado').setRequired(true)),

    new SlashCommandBuilder()
      .setName('listar-reactions')
      .setDescription('Lista todas as reaction roles configuradas')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ];

  await client.application.commands.set(commands);
  console.log('✅ Comandos registrados!');
});

// /setup-reaction
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setup-reaction') {
    const titulo = interaction.options.getString('titulo');
    const descricao = interaction.options.getString('descricao');
    const emoji = interaction.options.getString('emoji');
    const cargo = interaction.options.getRole('cargo');

    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descricao + `\n\n${emoji} → ${cargo}`)
      .setColor(0x5865F2)
      .setFooter({ text: 'Reaja para receber o cargo!' });

    const msg = await interaction.channel.send({ embeds: [embed] });
    await msg.react(emoji);

    reactionRoles[msg.id] = { [emoji]: cargo.id };

    await interaction.reply({ content: `✅ Mensagem criada! ID: \`${msg.id}\``, ephemeral: true });
  }

  if (interaction.commandName === 'add-reaction') {
    const msgId = interaction.options.getString('mensagem_id');
    const emoji = interaction.options.getString('emoji');
    const cargo = interaction.options.getRole('cargo');

    try {
      const msg = await interaction.channel.messages.fetch(msgId);
      await msg.react(emoji);

      if (!reactionRoles[msgId]) reactionRoles[msgId] = {};
      reactionRoles[msgId][emoji] = cargo.id;

      // Atualiza o embed adicionando o novo cargo
      const oldEmbed = msg.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed)
        .setDescription(oldEmbed.description + `\n${emoji} → ${cargo}`);
      await msg.edit({ embeds: [newEmbed] });

      await interaction.reply({ content: `✅ Adicionado: ${emoji} → ${cargo}`, ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: `❌ Mensagem não encontrada. Verifique o ID.`, ephemeral: true });
    }
  }

  if (interaction.commandName === 'listar-reactions') {
    if (Object.keys(reactionRoles).length === 0) {
      return interaction.reply({ content: '❌ Nenhuma reaction role configurada.', ephemeral: true });
    }

    let lista = '**Reaction Roles configuradas:**\n\n';
    for (const [msgId, emojis] of Object.entries(reactionRoles)) {
      lista += `📌 Mensagem \`${msgId}\`\n`;
      for (const [emoji, roleId] of Object.entries(emojis)) {
        lista += `  ${emoji} → <@&${roleId}>\n`;
      }
      lista += '\n';
    }

    await interaction.reply({ content: lista, ephemeral: true });
  }
});

// Dar cargo quando reage
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const config = reactionRoles[reaction.message.id];
  if (!config) return;

  const emoji = reaction.emoji.name;
  const roleId = config[emoji];
  if (!roleId) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  await member.roles.add(roleId).catch(console.error);
});

// Tirar cargo quando remove reação
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const config = reactionRoles[reaction.message.id];
  if (!config) return;

  const emoji = reaction.emoji.name;
  const roleId = config[emoji];
  if (!roleId) return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id);
  await member.roles.remove(roleId).catch(console.error);
});

client.login(process.env.TOKEN);

// Servidor HTTP para o Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot online!');
}).listen(PORT, () => {
  console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
});
