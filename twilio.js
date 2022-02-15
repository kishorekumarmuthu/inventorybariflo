require('dotenv').config();
const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN

const client = require('twilio')(accountSid, authToken);

function sendSMSNotification(messageBody){
    client.messages 
    .create({ 
       body: messageBody,  
       messagingServiceSid: 'MG25b2513f1744909ebbf1447f61e9469b',      
       to: '+919841510416' 
     }) 
    .then(message => console.log(message.sid)) 
    .done();
}

function sendWhatsAppNotification(whatsAppBody){
    client.messages 
      .create({ 
         body: whatsAppBody, 
         from: 'whatsapp:+14155238886',       
         to: 'whatsapp:+919841510416' 
       }) 
      .then(message => console.log(message.sid)) 
      .done();
}

//console.log(client)

module.exports = {sendSMSNotification, sendWhatsAppNotification}