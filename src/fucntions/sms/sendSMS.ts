import { AfricasTalking } from "../../helpers/africas-talking";

export default async function sendSMS(to: string, content) {
  try {
    const response = await AfricasTalking.SMS.send({
      to,
      message: content,
      from: "78076",
    });

    console.log("Message successfully sent to " + to);

    return true;
  } catch (e) {
    console.log("An error occured while sendibng SMS: ", e);
  }
}
