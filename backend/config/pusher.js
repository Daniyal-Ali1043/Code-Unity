const Pusher = require('pusher');
const { MessageModel, ConversationModel } = require("../models/ConversationModel");
const NotificationModel = require("../models/notificationModel");
const User = require("../models/UserModel");

const pusher = new Pusher({
  appId: "1974937",
  key: "c04d171d7e5f8f9fd830",
  secret: "d071afc46791ead6e59d",
  cluster: "ap2",
  useTLS: true
});

module.exports = pusher; // Export the instance directly