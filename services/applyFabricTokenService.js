const request = require("request");
const config = require("../config/config");

const applyFabricToken = () => {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",

      url: config.baseUrl + "/payment/v1/token",

      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
      },

      rejectUnauthorized: false,
      requestCert: false,
      agent: false,

      body: JSON.stringify({
        appSecret: config.appSecret,
      }),
    };

    request(options, (error, response) => {
      if (error) {
        return reject(error);
      }

      try {
        const result = JSON.parse(response.body);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
};

module.exports = applyFabricToken;