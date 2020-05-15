const sengGridMail = require("@sendgrid/mail");
sengGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (recipient) => {
  const message = {
    to: recipient,
    from: "joseph.brown-pobee@ashesi.edu.gh",
    subject: "Welcome to the Task App!",
    text: "Thank you for Signing Up",
    html: "<h1>H1</h1>",
  };

  sengGridMail.send(message);
  console.log(`Message sent to ${recipient}`);
};

const sendCancellationEmail = (recipient) => {
  const message = {
    to: recipient,
    from: "joseph.brown-pobee@ashesi.edu.gh",
    subject: "Sad to see you go",
    text: "Do let us know how we can help",
    html: "<h1>H1</h1>",
  };

  sengGridMail.send(message);
  console.log(`Cancellation Message sent to ${recipient}`);
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
};
