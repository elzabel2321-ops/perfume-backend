const { getSalesChart } = require("../services/analyticsService");
const { sendError } = require("../utils/httpError");

const getSalesChartHandler = async (req, res) => {
  try {
    const sales = await getSalesChart(req.query.period || "month");
    return res.status(200).json({ sales });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { getSalesChart: getSalesChartHandler };
