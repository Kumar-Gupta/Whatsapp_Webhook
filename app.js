const token = process.env.WHATSAPP_TOKEN;
const { v4: uuidv4 } = require('uuid');
const threeDigitNumberRegex = /\b(?:[3-9]\d{2,}|1000+)\b/;
const currentDate = new Date();
console.log(currentDate);

let user_phone_number;
let msg_body;
let type;
let user_token;
let user_data;
let user_devices;
let cart_data;
let delivery_fees;
let review_order;
let products;
let order_details;
let user_address;
let user_wallet;
let cart_id;
let price;
let order_data;
let language;

const request = require("request"),
  mongoose = require("mongoose"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json());


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
      
      
      let user_name = req.body.entry[0].changes[0].value.contacts[0].profile.name;
      let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = message.from;

      const app = process.env.APP_URI;

      if (message.text && message.text.body) {
        msg_body = message.text.body;
      } else if (message.button && message.button.text) {
        msg_body = message.button.payload;
      }else if (message.interactive.type === "button_reply" && message.interactive.button_reply.id) {
        msg_body = message.interactive.button_reply.id;
      }else if (message.interactive.type === "nfm_reply" && message.interactive.nfm_reply.response_json) {
        msg_body = message.type;
      }

      
      
      if (msg_body.toLowerCase() === "hii" || msg_body.toLowerCase() === "hi" || msg_body.toLowerCase() === "hello" 
          || msg_body.toLowerCase() === "menu" || msg_body.toLowerCase() === "hiii") {
        const phoneNumberWithoutCode = from.slice(2);
        const apiUrl = `${process.env.BASE_URL}/auth/customer/whatsappLogin`;
        const loginresponse = await axios.post(apiUrl, {
          phone: phoneNumberWithoutCode,
        });
   
        user_token = loginresponse.data.data.token;
        if (loginresponse.data.message == "Access Token Generated Successfully") {
          const apiUrl = `${process.env.BASE_URL}/auth/customer/userdata`;
          const userResponse = await axios.get(apiUrl, {
            headers: {
              Authorization: `Bearer ${user_token}`,
            },
          });
          user_data = userResponse.data.data.userData;
          user_address = userResponse.data.data.address;
          user_devices = userResponse.data.data.devices;

          console.log(user_data);
          console.log(user_address);
          console.log(user_devices);
           await send_language(user_data,phone_number_id, from); 
          // await sendMenu(user_data, phone_number_id, from);
        } else {
          await userRegisteration(phone_number_id, from, user_name, app);
          console.log("After User Registration");
        }
      }
      else if ( msg_body.toLowerCase() === "english") {
        console.log("Choose English");
         language = msg_body
        if (language.toLowerCase() == "english") {
          await sendMenu(user_data, phone_number_id, from)
        } else {
          await elseCase(phone_number_id, from);
        }
      }
      else if ( msg_body.toLowerCase() === "hindi") {
        console.log("Choose Hindi");
        language = msg_body
        if (language.toLowerCase() == "hindi") {
          await sendMenuHindi(user_data, phone_number_id, from)
        } else {
          await elseCase(phone_number_id, from);
        }
      }
      else if ( msg_body.toLowerCase() === "marathi") {
        console.log("Choose Marathi");
        language = msg_body
        if (language.toLowerCase() == "marathi") {
          await sendMenuMarathi(user_data, phone_number_id, from)
        } else {
          await elseCase(phone_number_id, from);
        }
      } 
      else if ( msg_body.toLowerCase() === "order diesel" || msg_body ===  "1" ) {
          console.log("Order Page");
          console.log(language)
        const apiUrl = `${process.env.BASE_URL}auth/branch/branchProducts`;
        const productsResponse = await axios.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${user_token}`,
          },
        });
        if (productsResponse.data.message == "Product fetched successfully") {
          products = productsResponse.data.data.productsData[0];
          if (user_data.is_privilaged === false) {
            console.log("I am here and I got products");
            
            price = products.branch_price;
             if(language.toLowerCase() === "english"){
             await dieselDetail(products, price, phone_number_id, from);
            }else if(language.toLowerCase() === "hindi"){
             await dieselDetailHindi(products, price, phone_number_id, from);
            }else if(language.toLowerCase() === "marathi" ){
              await dieselDetailMarathi(products, price, phone_number_id, from);
            }
          } else {
            
            price = user_data.fixed_price;
           if(language.toLowerCase() === "english"){
             await dieselDetail(products, price, phone_number_id, from);
            }else if(language.toLowerCase() === "hindi"){
             await dieselDetailHindi(products, price, phone_number_id, from);
            }else if(language.toLowerCase() === "marathi" ){
              await dieselDetailMarathi(products, price, phone_number_id, from);
            }
          }
        }
        else {
          const description = productsResponse.data.message;
          await elseCase(description, phone_number_id, from);
        }
      }
      else if ( msg_body.toLowerCase() === "track your order" || msg_body === "2" ) {
        console.log("Tracking On");
        const apiUrl = `${process.env.BASE_URL}auth/order/get-status`;
        const trackResponse = await axios.get(apiUrl,{
          headers: {
            Authorization: `Bearer ${user_token}`,
          },
        });
        
        const walletUrl = `${process.env.BASE_URL}auth/customer/wallet/get-wallet-amount`;
        const walletResponse =  await axios.get(walletUrl , {
          headers: {
            Authorization: `Bearer ${user_token}`,
          },
        });
        
        console.log("Got wallet Here:")
        console.log(walletResponse)
        if(trackResponse.data.message === "Order fetched successfully" && walletResponse.data.message === "Wallet has been fetched Successfully"){
          order_details = trackResponse.data.data.orders[0].order_detail;
          user_wallet = walletResponse.data.data.amount;
          console.log("Here is the wallet balance:" + user_wallet)
          const description = `Your Latest Order id: ${order_details.order_id} \n\nstatus: ${order_details.status} \n\nYour Remaing wallet Balance is ${user_wallet}`
          await elseCase(description, phone_number_id, from);
        } else {
          const description = `${trackResponse.data.message} `
          await elseCase(description, phone_number_id, from);
        }
      }
      else if ( msg_body.toLowerCase() === "wallet balance" || msg_body === "3" ) {
        console.log("wallet is On");
        const apiUrl = `${process.env.BASE_URL}auth/customer/wallet/get-wallet-amount`;
        const walletResponse = await axios.get(apiUrl,{
          headers: {
            Authorization: `Bearer ${user_token}`,
          },
        });

        if(walletResponse.data.message === "Wallet has been fetched Successfully"){
          user_wallet = walletResponse.data.data.amount;
          const description = `Your Current Available Credit Balance is ${user_wallet}.`
          await elseCase(description, phone_number_id, from);
        } else {
          const description = `${walletResponse.data.message} `
          await elseCase(description, phone_number_id, from);
        }
      }
      else if (  msg_body.toLowerCase() === "exit" || msg_body.toLowerCase() === "stop" || msg_body === "4" ) {
        console.log("exit is On");
      }
      else if (threeDigitNumberRegex.test(msg_body)) {
        const addCart = `${process.env.BASE_URL}auth/cart/add`;
        const addCartresponse = await axios.post(addCart, {
          product: products._id,
          quantity: msg_body,
        }, {
          headers: {
            Authorization: `Bearer ${user_token}`,
          },
        });
        if (addCartresponse.data.message == "Cart added successfully") {
          const getCart = `${process.env.BASE_URL}auth/cart/get`;
          const getCartresponse = await axios.get(getCart, {
            headers: {
              Authorization: `Bearer ${user_token}`,
            },
          });

          if (getCartresponse.data.message == "Cart data retrieved successfully") {
            cart_data = getCartresponse.data.data.cartData;

            const getDeliveryFees = `${process.env.BASE_URL}auth/branch/getDeliveryFees`;
            const getDeliveryFeesresponse = await axios.get(getDeliveryFees, {
              headers: {
                Authorization: `Bearer ${user_token}`,
              },
            });

            if (getDeliveryFeesresponse.data.message == "Delivery Fees fetched successfully") {
              console.log(cart_data);
              const address_id = user_address._id;
              const cart_id = cart_data.cart_id;
              const delivery_date = currentDate;
              const delivery_time = "10:00 - 5:00";
              const payment_method = "User Credit";
              const note = "This Order is from Whatsapp";
              const quantity = parseFloat(cart_data.products[0].quantity);
              const price = parseFloat(cart_data.products[0].price);
              const total_price = quantity * price;
              const coupon_discount = 0;
              delivery_fees = parseFloat(getDeliveryFeesresponse.data.data.deliveryFees);
              const grand_total = total_price - coupon_discount + delivery_fees;
              console.log(delivery_fees)

              review_order = {
                "address_id" : address_id,
                "cart_id" : cart_id,
                "delivery_date" : getNextDate(delivery_date),
                "delivery_time" : delivery_time,
                "payment_method" : payment_method,
                "note" : note,
                "total_price" : total_price,
                "coupon_discount" : coupon_discount,
                "delivery_fee" : delivery_fees,
                "grand_total" : grand_total,
              };

                  const reviewData = {
                    name : products.name,
                    quantity : cart_data.products[0].quantity.toString(),
                    grand_total : review_order.grand_total.toString(),
                  }
                  const description = "Cart Added SuccessFully,please enter 'Confirm' to place your order";
                  if(language.toLowerCase() === "english"){
                   await cartDetail( reviewData , phone_number_id, from);
                  }else if( language.toLowerCase() === "hindi"){
                   await cartDetailHindi( reviewData , phone_number_id, from);
                  }else if( language.toLowerCase() === "marathi"){
                   await cartDetailMarathi( reviewData , phone_number_id, from);
                  }
            } else {
              console.log(getDeliveryFeesresponse.data.message);
            }
          } else {
            console.log("Cart Doesn't Exists");
            const description = getCartresponse.data.message;
            await elseCase(description, phone_number_id, from);
          }
        } else {
          console.log("Cart Already Exists");
          const getCart = `${process.env.BASE_URL}auth/cart/get`;
          const getCartresponse = await axios.get(getCart, {
            headers: {
              Authorization: `Bearer ${user_token}`,
            },
          });

          const getDeliveryFees = `${process.env.BASE_URL}auth/branch/getDeliveryFees`;
            const getDeliveryFeesresponse = await axios.get(getDeliveryFees, {
              headers: {
                Authorization: `Bearer ${user_token}`,
              },
            });

            if (getDeliveryFeesresponse.data.message == "Delivery Fees fetched successfully") {
              cart_data = getCartresponse.data.data.cartData;
              console.log(cart_data);
              const address_id = user_address._id;
              const cart_id = cart_data.cart_id;
              const delivery_date = currentDate;
              const delivery_time = "10:00 - 5:00";
              const payment_method = "User Credit";
              const note = "This Order is from Whatsapp";
              const quantity = parseFloat(cart_data.products[0].quantity);
              const price = parseFloat(cart_data.products[0].price);
              const total_price = quantity * price;
              const coupon_discount = 0;
              delivery_fees = parseFloat(getDeliveryFeesresponse.data.data.deliveryFees);
              const grand_total = total_price - coupon_discount + delivery_fees;
              console.log(delivery_fees)

              review_order = {
                "address_id" : address_id,
                "cart_id" : cart_id,
                "delivery_date" : getNextDate(delivery_date),
                "delivery_time" : delivery_time,
                "payment_method" : payment_method,
                "note" : note,
                "total_price" : total_price,
                "coupon_discount" : coupon_discount,
                "delivery_fee" : delivery_fees,
                "grand_total" : grand_total,
              };

              const reviewData = {
                name : products.name,
                quantity : cart_data.products[0].quantity.toString(),
                grand_total : review_order.grand_total.toString(),
              }

              console.log(reviewData);
              if(language.toLowerCase() === "english"){
              await cartDetail( reviewData , phone_number_id, from);
              }else if(language.toLowerCase() === "hindi"){
              await cartDetailHindi( reviewData , phone_number_id, from);
              }else if(language.toLowerCase() === "marathi"){
              await cartDetailMarathi( reviewData , phone_number_id, from); 
              }
              const description = addCartresponse.data.message;
              await elseCase(description, phone_number_id, from);
            }else {
              console.log(getDeliveryFeesresponse.data.message);
            }
          }
      }
      else if (msg_body.toLowerCase() < "300") {
        const description = "We only accept orders more than 300 liters.";
        await elseCase(description, phone_number_id, from); 
      }
      else if (msg_body.toLowerCase() === "yes" || msg_body.toLowerCase() === "confirm") {
        console.log("confirm");
        console.log(review_order);
        const apiUrl = `${process.env.BASE_URL}auth/order/add`;
        const getOrderResponse =  await axios.post(apiUrl, review_order,{
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${user_token}`,
                                    },
                                  });

        console.log(getOrderResponse)
        if(getOrderResponse.data.message === "Order Placed successfully"){
          console.log("success")
          order_data = getOrderResponse.data.data.order;

          // const description = `${getOrderResponse.data.message} Once the order get confirmed from the admin you can easily generate your bill thank you <3`
          // await elseCase(description, phone_number_id, from);
          
          if( language.toLowerCase() === "english"){
            await thankYouTemplate(user_data,phone_number_id, from);
          }else if( language.toLowerCase() === "hindi"){
            await thankYouTemplateHindi(user_data,phone_number_id, from);
          }else if( language.toLowerCase() === "marathi"){
            await thankYouTemplateMarathi(user_data,phone_number_id, from);
          }
          
        } else {
          order_data = ("unsuccessful")
          const description = `${getOrderResponse.data.message}`
          await elseCase(description, phone_number_id, from);
        }
      }
      else if (msg_body.toLowerCase() === "no" || msg_body.toLowerCase() === "clear") {
        console.log("clear");
        const cart_id = {
          cart_id : review_order.cart_id
        }

        console.log(cart_id)
        const apiUrl = `${process.env.BASE_URL}auth/cart/delete`;
        const getCartresponse =  await axios.delete(apiUrl,cart_id,{
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${user_token}`,
                                    },
                                  });

        console.log(getCartresponse)
        if(getCartresponse.data.message === "Cart deleted successfully"){
          console.log("success")
          const description = `${getCartresponse.data.message}, Now press "1" or just enter "Order Diesel " for placing new order`
          await elseCase(description, phone_number_id, from);
        } else {
          order_data = ("unsuccessful")
          const description = `${getCartresponse.data.message}`
          await elseCase(description, phone_number_id, from);
        }
      }
      
      res.sendStatus(200);
    }
  } else {
    res.sendStatus(404);
  }
});



//Customer's Language Preference
async function send_language(user_data, phone_number_id, from ){
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
         {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "body": {
                "text": "Hii " + user_data.first_name + ", \n Please Select your Preferred Language"
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "english",
                      "title": "English"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "hindi",
                      "title": "हिंदी"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "marathi",
                      "title": "मराठी"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
  }                      
}

// Registration
async function userRegisteration(phone_number_id, from, user_name, app){
  try {
    const response = await axios.post(
        `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
        {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: from,
              type: "text",
              text: {
                preview_url: true,
                body: `Hi ${user_name},\nYour prior registration with us is currently not on record. \nTo optimize your experience with our service, we recommend registering on our JOSH DOORSTEP SERVICE app. \nApp Link: ${app}`
              }
        },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error.message);
  }
}



// Menu
async function sendMenu(user_data, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
              {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": "Hii "+ user_data.first_name + ", \nThank you for reaching us,\nwe are glad we got the opportunity to serve you \n \nlet us know how we can help you?"
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "order diesel",
                      "title": "Order Diesel"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "track order",
                      "title": "Track your Order"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "exit",
                      "title": "Exit"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log(error);
  }
}

async function sendMenuHindi(user_data, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
        {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": "नमस्ते "+ user_data.first_name + ", \nहम तक पहुंचने के लिए धन्यवाद, \nहमें बताएं कि हम आपकी सहायता कैसे कर सकते हैं?"
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "order diesel",
                      "title": "डीजल ऑर्डर करें"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "track order",
                      "title": "अपना ऑर्डर ट्रैक करें"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "exit",
                      "title": "बाहर निकलें"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log(error);
  }
}

async function sendMenuMarathi(user_data, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
            {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": "नमस्कार "+ user_data.first_name + "+, आमच्यापर्यंत पोहोचल्याबद्दल धन्यवाद, \n \nआम्हाला कळवा आम्ही तुम्हाला कशी मदत करू शकतो?"
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "order diesel",
                      "title": "डिझेल ऑर्डर"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "track order",
                      "title": "तुमच्या ऑर्डरचा मागोवा घ्या"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "exit",
                      "title": "बाहेर पडा"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.log(error);
  }
}

// Product Details
async function dieselDetail(products, price, phone_number_id, from) {

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  "body" : `*Product Details* \nProduct name : ${products.name } \nPrice : ₹${price}\n\nEnter the Quantity for the ${products.name} below:`
                }

        },
      { headers: { "Content-Type": "application/json" } },
    );
    // Handle response from API
  } catch (error) {
    console.error(error);
  }
}

async function dieselDetailHindi(products, price, phone_number_id, from) {

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  "body" : `*प्रॉडक्ट की जानकारी* \nप्रॉडक्ट का नाम : ${products.name } \nमूल्य : ₹${price}\n\n ${products.name} के लिए मात्रा दर्ज करें:`
                }

        },
      { headers: { "Content-Type": "application/json" } },
    );
    // Handle response from API
  } catch (error) {
    console.error(error);
  }
}

async function dieselDetailMarathi(products, price, phone_number_id, from) {

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  "body" : `*उत्पादन तपशील* \nउत्पादनाचे नाव : ${products.name } \nकिंमत : ₹${price}\n\n ${products.name} साठी प्रमाण प्रविष्ट करा:`
                }

        },
      { headers: { "Content-Type": "application/json" } },
    );
    // Handle response from API
  } catch (error) {
    console.error(error);
  }
}

// Cart Details
async function cartDetail(reviewData, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": `Your Delivery has been recorded, \nYour order details are below: \nProduct Name:${reviewData.name} \nTotal Quantity: ₹${reviewData.quantity} \nTotal Price: ${reviewData.grand_total} \n\nCart Added Successfully, Please enter 'Confirm' to place your order. \nIn case you have to update or clear your Cart,  Please enter 'Clear' to clear your cart.`
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "confirm",
                      "title": "Confirm"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "clear",
                      "title": "Clear"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

async function cartDetailHindi(reviewData, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
         {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": `आपकी डिलीवरी रिकॉर्ड कर ली गई है, \nआपके ऑर्डर का विवरण नीचे है: \nउत्पाद का नाम: ${reviewData.name} \nकुल मात्रा: ₹${reviewData.quantity} \nकुल कीमत: ${reviewData.grand_total} \n\nकार्ट सफलतापूर्वक जोड़ा गया है, कृपया अपना ऑर्डर देने के लिए ' Yes' दर्ज करें।  \nयदि आपको अपना कार्ट अपडेट करना है या रद्द करना है, तो कृपया अपना कार्ट रद्द करने के लिए 'No' दर्ज करें।`
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "confirm",
                      "title": "Yes"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "clear",
                      "title": "No"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

async function cartDetailMarathi(reviewData, phone_number_id, from) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
       {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": from,
            "type": "interactive",
            "interactive": {
              "type": "button",
              "header":{
                "type": "text",
                  "text": "Welcome to Josh Doorstep Service"
                },
              "body": {
                "text": `तुमची डिलिव्हरी रेकॉर्ड केली गेली आहे,, \nतुमच्या ऑर्डरचे तपशील खाली दिले आहेत: \nउत्पादनाचे नाव: ${reviewData.name} \nएकूण प्रमाण: ${reviewData.quantity} \nएकूण किंमत: ₹${reviewData.grand_total} \n\nकार्ट यशस्वीरित्या जोडले, कृपया तुमची ऑर्डर देण्यासाठी 'Yes' प्रविष्ट करा. \nतुम्हाला तुमची कार्ट अपडेट किंवा रद्द करायची असल्यास, कृपया तुमची कार्ट रद्द करण्यासाठी 'No' प्रविष्ट करा.`
              },
              "action": {
                "buttons": [
                  {
                    "type": "reply",
                    "reply": {
                      "id": "confirm",
                      "title": "Yes"
                    }
                  },
                  {
                    "type": "reply",
                    "reply": {
                      "id": "clear",
                      "title": "No"
                    }
                  }
                ]
              }
            }
          },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

// Thankyou Template
async function thankYouTemplate(user_data,phone_number_id, from){
   try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
       {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  body :`*Thank You*\nThank you for confirming your order details.\n
Your order has been successfully placed with us, and we are in the process of preparing it for delivery.\n
Anticipate your delivery soon.`
                }
        },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

async function thankYouTemplateHindi(user_data,phone_number_id, from){
   try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
      {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  body :`*धन्यवाद* \nअपने ऑर्डर विवरण की पुष्टि करने के लिए धन्यवाद।\n
आपका ऑर्डर सफलतापूर्वक हमारे पास रख दिया गया है, और हम इसे डिलीवरी के लिए तैयार करने की प्रक्रिया में हैं।\n
शीघ्र ही अपनी डिलीवरी की आशा करें.`
                }
        },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

async function thankYouTemplateMarathi(user_data,phone_number_id, from){
   try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
         {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  body :`*धन्यवाद* \nतुमच्या ऑर्डर तपशीलांची पुष्टी केल्याबद्दल धन्यवाद.\n
तुमची ऑर्डर आमच्याकडे यशस्वीरित्या ठेवली गेली आहे आणि आम्ही ती वितरणासाठी तयार करण्याच्या प्रक्रियेत आहोत.\n
लवकरच तुमच्या डिलिव्हरीची अपेक्षा करा.`
                }
        },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in cartDetail:', error.message);
  }
}

//else case
async function elseCase(description, phone_number_id, from ){
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${token}`,
          {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": from,
                "type": "text",
                "text" : {
                  body : description
                }

        },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
  }                      
}




// Get the
function getNextDate(currentDate) {
  // Get UTC date components
  const day = currentDate.getUTCDate();
  const month = currentDate.getUTCMonth();
  const year = currentDate.getUTCFullYear();

  // Create a Date object with the current date
  const current = new Date(Date.UTC(year, month, day));

  // Calculate the next date by adding one day
  const nextDate = new Date(current);
  nextDate.setUTCDate(current.getUTCDate() + 1);

  // Format the next date as "DD/MM/YYYY"
  const nextDay = String(nextDate.getUTCDate()).padStart(2, '0');
  const nextMonth = String(nextDate.getUTCMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
  const nextYear = nextDate.getUTCFullYear();

  return `${nextDay}/${nextMonth}/${nextYear}`;
}

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
  res.status(200).send("Checkint the host");
});

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

