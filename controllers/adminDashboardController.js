const { sendError } = require("../utils/httpError");
const { getDashboard } = require("../services/analyticsService");

const getDashboardHandler = async (req, res) => {
  try {
    const dashboard = await getDashboard();
    return res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getDashboard: getDashboardHandler };
