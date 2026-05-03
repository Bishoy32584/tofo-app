const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const sendMessage = async ({ sender, receiver, content }) => {

  const message = new Message({
    sender,
    receiver,
    content,
    status: "SENT"
  });

  const saved = await message.save();

  const participants = [sender, receiver].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants }
  });

  if (!conversation) {
    conversation = new Conversation({
      participants,
      unread: new Map()
    });
  }

  conversation.lastMessage = content;
  conversation.lastMessageAt = new Date();

  const receiverUnread =
    conversation.unread?.get(receiver.toString()) || 0;

  conversation.unread.set(receiver.toString(), receiverUnread + 1);
  conversation.unread.set(sender.toString(), 0);

  await conversation.save();

  return { message: saved, conversation };
};

module.exports = {
  sendMessage
};