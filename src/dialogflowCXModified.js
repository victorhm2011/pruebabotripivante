/**
 * NO TOCAR ESTE ARCHIVO: Es generado automaticamente, si sabes lo que haces adelante ;)
 * de lo contrario mejor ir a la documentacion o al servidor de discord link.codigoencasa.com/DISCORD
 */
"use strict";

var require$$0 = require("@bot-whatsapp/bot");
var require$$1 = require("@google-cloud/dialogflow-cx");
const { log } = require("console");
var require$$2 = require("fs");
var require$$3 = require("path");

const { CoreClass } = require$$0;
const { SessionsClient } = require$$1.v3beta1;
const { existsSync, readFileSync } = require$$2;
const { join } = require$$3;

/**
 * Necesita extender de core.class
 * handleMsg(messageInComming) //   const { body, from } = messageInComming
 */

const GOOGLE_ACCOUNT_PATH = join(process.cwd(), "google-key.json");

class DialogFlowCXContext extends CoreClass {
  // Opciones del usuario
  optionsDX = {
    language: "es",
    location: "",
    agentId: "",
    businessNumber: "",
  };
  projectId = null;
  configuration = null;
  sessionClient = null;

  constructor(_database, _provider, _optionsDX = {}, _businessNumber = null) {
    super(null, _database, _provider);

    this.optionsDX = { ...this.optionsDX, ..._optionsDX };
    this.businessNumber = _optionsDX.businessNumber;

    this.init();
  }

  /**
   * Verificar conexión con servicio de DialogFlow
   */
  init = () => {
    if (!existsSync(GOOGLE_ACCOUNT_PATH)) {
      console.log(`[ERROR]: No se encontro ${GOOGLE_ACCOUNT_PATH}`);
      /**
       * Emitir evento de error para que se mueste por consola dicinedo que no tiene el json
       *  */
    }

    if (!this.optionsDX.location.length)
      throw new Error("LOCATION_NO_ENCONTRADO");
    if (!this.optionsDX.agentId.length)
      throw new Error("AGENTID_NO_ENCONTRADO");

    const rawJson = readFileSync(GOOGLE_ACCOUNT_PATH, "utf-8");
    const { project_id, private_key, client_email } = JSON.parse(rawJson);

    this.projectId = project_id;

    this.sessionClient = new SessionsClient({
      credentials: { private_key, client_email },
      apiEndpoint: `${this.optionsDX.location}-dialogflow.googleapis.com`,
    });
  };

  /**
   * GLOSSARY.md
   * @param {*} messageCtxInComming
   * @returns
   */
  handleMsg = async (messageCtxInComming) => {
    const languageCode = this.optionsDX.language;
    const { from, body } = messageCtxInComming;

    /**
     * 📄 Creamos session de contexto basado en el numero de la persona
     * para evitar este problema.
     * https://github.com/codigoencasa/bot-whatsapp/pull/140
     */

    const session = this.sessionClient.projectLocationAgentSessionPath(
      this.projectId,
      this.optionsDX.location,
      this.optionsDX.agentId,
      from
    );

    const reqDialog = {
      session,
      queryInput: {
        text: {
          text: body,
        },
        languageCode,
      },
    };

    const [single] = (await this.sessionClient.detectIntent(reqDialog)) || [
      null,
    ];
    const listMessages = single.queryResult.responseMessages.map((res) => {
      if (res.message == "text") {
        return { answer: res.text.text[0] };
      }

      if (res.message == "payload") {
        const {
          media = null,
          buttons = [],
          answer = "",
          escalateMessageToBusiness = false,
          messageToBusiness = null,
        } = res.payload.fields;

        const buttonsArray = buttons?.listValue?.values?.map((btnValue) => {
          const { stringValue } = btnValue.structValue.fields.body;
          return { body: stringValue };
        });

        if (escalateMessageToBusiness) {
          const d = new Date();
          let defaultMessage =
            "El numero " +
            from +
            " necesita tu ayuda en un mensaje enviado a las: " +
            d.getHours() +
            ":" +
            d.getMinutes() +
            " al numero de tu restaurante";
          this.sendFlowSimple(
            [
              {
                answer: messageToBusiness?.stringValue || defaultMessage,
              },
            ],
            this.businessNumber
          );
        }
        return {
          answer: answer?.stringValue,
          options: {
            media: media?.stringValue,
            buttons: buttonsArray,
          },
        };
      }
    });
    console.log(listMessages);

    this.sendFlowSimple(listMessages, from);
  };
}

var dialogflowCx_class = DialogFlowCXContext;

const DialogCXFlowClass = dialogflowCx_class;

/**
 * Crear instancia de clase Bot
 * @param {*} args
 * @returns
 */
const createBotDialog = async ({ database, provider }, _options) =>
  new DialogCXFlowClass(database, provider, _options);

var dialogflowCx = {
  createBotDialog,
  DialogCXFlowClass,
};

module.exports = dialogflowCx;
