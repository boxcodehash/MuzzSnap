const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { ethers } = require("ethers");

admin.initializeApp();

const MUZZLE = "0xEF3DAA5FDA8AD7AABFF4658F1F78061FD626B8F0";
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const MIN = 20000000;

exports.loginSIWE = functions.https.onCall(async (data) => {
  const { wallet, message, signature } = data;

  const recovered = ethers.utils.verifyMessage(message, signature);
  if (recovered.toLowerCase() !== wallet.toLowerCase())
    throw new functions.https.HttpsError("unauthenticated");

  const provider = new ethers.providers.JsonRpcProvider(
    "https://cloudflare-eth.com"
  );
  const token = new ethers.Contract(MUZZLE, ABI, provider);
  const bal = await token.balanceOf(wallet);
  const dec = await token.decimals();
  const amount = Number(ethers.utils.formatUnits(bal, dec));

  if (amount < MIN)
    throw new functions.https.HttpsError("permission-denied","Not enough MUZZLE");

  const customToken = await admin.auth().createCustomToken(wallet.toLowerCase());
  return { token: customToken };
});

exports.sendMessage = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError("unauthenticated");

  const text = data.text;
  if (!text || text.length > 300 || /https?:\/\//i.test(text))
    throw new functions.https.HttpsError("invalid-argument");

  const ref = admin.database().ref("lastMessage/"+ctx.auth.uid);
  const snap = await ref.get();
  const last = snap.val() || 0;
  if (Date.now() - last < 2000)
    throw new functions.https.HttpsError("resource-exhausted");

  await admin.database().ref("messages/global").push({
    user: ctx.auth.uid,
    text,
    ts: Date.now()
  });
  await ref.set(Date.now());
});
