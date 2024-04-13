const { createProvider } = require("@bot-whatsapp/bot");
const MockAdapter = require("./src/emptyDatabaseAdapter.cjs");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const { createBotDialog } = require("./src/dialogflowCXModified");
const adapterDB = new MockAdapter();
const main = async () => {
  const location = "us-central1";
  const agentId = "95607b0e-0822-47be-a669-55c643083077";
  let optionsDX = {
    location: location,
    agentId: agentId,
    businessNumber: "59177471896",
  };
  const adapterProvider = createProvider(BaileysProvider);
  createBotDialog(
    {
      provider: adapterProvider,
      database: adapterDB,
    },
    optionsDX
  );
};

main();
