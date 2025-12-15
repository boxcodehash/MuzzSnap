// ================= CONFIG =================
const MUZZLE_CONTRACT = "0xef3dAa5fDa8Ad7aabFF4658f1F78061fd626B8f0";
const NETWORK_CHAIN_ID = "0x1"; // Ethereum Mainnet
const SESSION_KEY = "muzzsnap_session";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// ================ UI ======================
function setStatus(msg) {
    document.getElementById("status").innerText = msg;
}

// ============== HELPERS ===================
function metamaskDeepLink() {
    const clean = location.href.replace(/^https?:\/\//, "");
    return `https://metamask.app.link/dapp/${clean}`;
}

function encrypt(data) {
    return btoa(JSON.stringify(data));
}

// ============== CORE ======================
async function connectWallet() {
    try {
        if (!window.ethereum) {
            window.location.href = metamaskDeepLink();
            return;
        }

        setStatus("Connecting wallet...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: NETWORK_CHAIN_ID }]
        });

        const signer = provider.getSigner();
        const address = await signer.getAddress();

        const nonce = Math.floor(Math.random() * 1e9);
        const issued = new Date().toISOString();
        const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const message = `muzzsnap.com wants you to sign in with your Ethereum account:
${address}

Nonce: ${nonce}
Issued At: ${issued}
Expiration Time: ${exp}`;

        setStatus("Signing authentication...");
        const signature = await signer.signMessage(message);

        const recovered = ethers.utils.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase())
            throw new Error("Signature verification failed");

        setStatus("Checking MUZZLE balance...");
        const contract = new ethers.Contract(
            MUZZLE_CONTRACT,
            ERC20_ABI,
            provider
        );

        const decimals = await contract.decimals();
        const minBalance = ethers.utils.parseUnits("20000000", decimals);
        const balance = await contract.balanceOf(address);

        if (balance.lt(minBalance))
            throw new Error("Access denied due to privacy policy");

        const session = {
            address,
            signature,
            exp
        };

        localStorage.setItem(SESSION_KEY, encrypt(session));
        window.location.href = "pagina_segura.html";

    } catch (err) {
        setStatus(err.message);
    }
}
