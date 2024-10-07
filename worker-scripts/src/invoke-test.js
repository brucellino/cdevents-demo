export default {
  async queue(batch, env, ctx) {

    async function gatherResponse(response) {
      const { headers } = response;
      const contentType = headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return JSON.stringify(await response.json());
      } else if (contentType.includes("application/text")) {
        return response.text();
      } else if (contentType.includes("text/html")) {
        return response.text();
      } else {
        return response.text();
      }
    }

    // consume the message
    for (const message of batch.messages) {
      // console.log(message);
      const init = {
        body: message.body,
        method: "POST",
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      };
      console.log(init)
      // console.log(JSON.stringify(init));
      const response = await fetch("https://start-test.eoscnode.org/", init);
      const results = await gatherResponse(response)
      console.log(results);
      message.ack();
    }

    // check if it was on staging or production

    // invoke test


  },
};
