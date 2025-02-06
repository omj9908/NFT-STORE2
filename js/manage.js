const contractAddress = "0x9fCf9c341cAD3De0953fAeCb83162B2d431D2DaD"; // ✅ 최신 컨트랙트 주소
const contractABI = [
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getOwnedNFTs",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getNFTInfo",
    "outputs": [
      { "internalType": "string", "name": "tokenURI", "type": "string" },
      { "internalType": "string", "name": "tokenName", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let web3;
let contract;

// ✅ **MetaMask 연결**
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask를 설치하세요!");
    return null;
  }
  web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  contract = new web3.eth.Contract(contractABI, contractAddress);
}

async function loadMyNFTs() {
  await connectWallet();
  const accounts = await web3.eth.getAccounts();
  const nftContainer = document.getElementById("nftContainer");
  nftContainer.innerHTML = "";
  document.getElementById("status").innerText = "NFT 불러오는 중...";

  try {
    const nftList = await contract.methods.getOwnedNFTs(accounts[0]).call();

    if (nftList.length === 0) {
      document.getElementById("status").innerText = "소유한 NFT가 없습니다.";
      return;
    }
    document.getElementById("status").innerText = "";

    for (let tokenId of nftList) {
      try {
        console.log(`Fetching NFT info for Token ID: ${tokenId}`);
        const nft = await contract.methods.getNFTInfo(tokenId).call();

        // ✅ **IPFS Gateway 적용**
        let imageUrl = nft.tokenURI;
        if (imageUrl.startsWith("ipfs://")) {
          imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
        }

        const nftElement = document.createElement("div");
        nftElement.classList.add("col-md-4", "mb-4");

        nftElement.innerHTML = `
          <div class="card shadow-sm">
            <img src="${imageUrl}" class="card-img-top" onerror="this.onerror=null;this.src='https://via.placeholder.com/250'">
            <div class="card-body text-center">
              <h5 class="card-title">NFT #${tokenId} - ${nft.tokenName || "이름 없음"}</h5>
              <p><b>소유자:</b> ${nft.owner}</p>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" onclick="changeNFTName(${tokenId})">이름 변경</button>
                <button class="btn btn-danger" onclick="burnNFT(${tokenId})">폐기</button>
              </div>
            </div>
          </div>
        `;
        nftContainer.appendChild(nftElement);
      } catch (error) {
        console.error(`❌ Error fetching NFT info for Token ID: ${tokenId}`, error);
      }
    }
  } catch (error) {
    console.error("❌ 소유한 NFT 조회 오류:", error);
    document.getElementById("status").innerText = "NFT 조회 오류 발생!";
  }
}


// ✅ **NFT 이름 변경 기능 추가**
async function changeNFTName(tokenId) {
  const newName = prompt("새로운 NFT 이름을 입력하세요:");
  if (!newName) return;

  await connectWallet();
  const accounts = await web3.eth.getAccounts();
  
  try {
    await contract.methods.setNFTName(tokenId, newName).send({ from: accounts[0] });
    alert(`✅ NFT ${tokenId}의 이름이 '${newName}'으로 변경되었습니다.`);
    loadMyNFTs(); // ✅ 새로고침
  } catch (error) {
    console.error("❌ NFT 이름 변경 오류:", error);
    alert("이름 변경 실패! 소유자만 변경할 수 있습니다.");
  }
}

// ✅ **NFT 폐기 (소각)**
async function burnNFT(tokenId) {
  if (!confirm(`⚠️ NFT #${tokenId}을 영구적으로 삭제하시겠습니까?`)) return;

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    await contract.methods.burnNFT(tokenId).send({ from: accounts[0] });
    alert(`🔥 NFT #${tokenId}가 삭제되었습니다.`);
    loadMyNFTs(); // ✅ 새로고침
  } catch (error) {
    console.error("❌ NFT 삭제 오류:", error);
    alert("NFT 삭제 실패! 소유자만 삭제할 수 있습니다.");
  }
}
