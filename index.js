const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🔧 CONFIGURAÇÕES DINÂMICAS
let embedConfig = {
  title: 'Painel de Cargos',
  description: 'Clique no botão abaixo para ir ao canal de criação de cargos!',
  color: 0x5865F2,
};

let buttonConfig = {
  label: 'Ir para o canal',
  url: 'https://discord.com/channels/1426225171689111594/1427249080144236544',
};

// Comando /painel
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('painel')
      .setDescription('Envia o painel com botão que leva ao canal'),
    new SlashCommandBuilder()
      .setName('painel-config')
      .setDescription('Edita o embed e o nome do botão')
      .addStringOption(option =>
        option.setName('titulo')
          .setDescription('Novo título do embed')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('descricao')
          .setDescription('Nova descrição do embed')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('botao')
          .setDescription('Novo nome do botão')
          .setRequired(false))
  ];

  await client.application.commands.set(commands);
});

// Interações
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'painel') {
    const embed = new EmbedBuilder()
      .setTitle(embedConfig.title)
      .setDescription(embedConfig.description)
      .setColor(embedConfig.color);

    const button = new ButtonBuilder()
      .setLabel(buttonConfig.label)
      .setStyle(ButtonStyle.Link)
      .setURL(buttonConfig.url);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  if (interaction.commandName === 'painel-config') {
    const novoTitulo = interaction.options.getString('titulo');
    const novaDescricao = interaction.options.getString('descricao');
    const novoBotao = interaction.options.getString('botao');

    if (novoTitulo) embedConfig.title = novoTitulo;
    if (novaDescricao) embedConfig.description = novaDescricao;
    if (novoBotao) buttonConfig.label = novoBotao;

    await interaction.reply({
      content: '✅ Configurações atualizadas com sucesso!',
      ephemeral: true
    });
  }
});

// Token via variável de ambiente (seguro!)
client.login(process.env.TOKEN);