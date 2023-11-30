
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server
  

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      const message = req.body.entry[0].changes[0].value.messages[0];

      let user_name =
        req.body.entry[0].changes[0].value.contacts[0].profile.name;
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = message.from;
      let msg_body;

      if (message.text && message.text.body) {
        msg_body = message.text.body;
      } else if (message.button && message.button.text) {
        msg_body = message.button.payload;
      }

      if (
        msg_body.toLowerCase() === "hii" ||
        msg_body.toLowerCase() === "hi" ||
        msg_body.toLowerCase() === "hello"
      ) {
        await sendTemplate(phone_number_id, from, user_name);
      } else if (msg_body === "Order Diesel" || msg_body === "Diesel Delivery") {
        console.log("diesel worked");
        await DieselDelivery(phone_number_id, from, user_name);
      } else if (msg_body === "Book 4-wheeler Service" || msg_body === "4 wheeler Service") {
        console.log("wheeler worked");
        console.log(phone_number_id + from + user_name)
        await FourWheelerService(phone_number_id, from, user_name);
      }
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});

async function sendTemplate(phone_number_id, from, user_name) {
  
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "template",
        template: {
          name: "order",
          language: {
            code: "en_US",
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: user_name,
                }
              ],
            },
          ],
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error.message);
  }
}

async function DieselDelivery(phone_number_id, from, user_name) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: from,
        type: "template",
        template: {
          name: "order_details",
          language: {
            code: "en_US",
          }
        }
      }
    );
  } catch(error){
    console.error(error.message);
  }
  console.log("Diesel delivery is placed from " + from + " by " + user_name);
}

async function FourWheelerService(phone_number_id, from, user_name) {
  try{
    const reponse = await axios.post(
    `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "from",
        type: "template",
        template: "order_details",
        language:{
          code: "en_US",
        }
      }
    )
    
  }catch(error){
    console.error(error.message);
  }
  console.log("4 wheeler service is booked from " + from + " by " + user_name);
}

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

app.get("/", (req, res) => {
  res.status(200).send("hello World");
});
