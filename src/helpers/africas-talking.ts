import africastalking from "africastalking";

const credentials = {
  apiKey:
    "atsk_d9f2101670a5928240a839f0eccc013b2bd30177d129cf2912d5eaa241564c563490ca44", // use your sandbox app API key for development in the test environment
  username: "sandbox", // use 'sandbox' for development in the test environment
};

export const AfricasTalking = africastalking(credentials);