const { sendError } = require("../utils/httpError");
const { getSettings, updateSettings } = require("../services/settingsService");

const getSettingsHandler = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateSettingsHandler = async (req, res) => {
  try {
    const settings = await updateSettings(req.body);
    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getSettings: getSettingsHandler,
  updateSettings: updateSettingsHandler,
};
