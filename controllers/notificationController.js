const { sendError } = require("../utils/httpError");
const { listForUser, markRead } = require("../services/notificationService");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await listForUser(req.user.id);
    return res.status(200).json({ ok: true, notifications });
  } catch (error) {
    return sendError(res, error);
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await markRead(req.user.id, req.params.id);
    return res.status(200).json({ ok: true, notification });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getMyNotifications, markNotificationRead };
