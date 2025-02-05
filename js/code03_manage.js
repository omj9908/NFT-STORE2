const contractAddress = "0xF16BE0490925535a005Ea8B4F5DD089CE70D9D61"; // ✅ 최신 컨트랙트 주소
const contractABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getNFTInfo",
    "outputs": [
      { "internalType": "string", "name": "tokenURI", "type": "string" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "burnNFT", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "uint256", "name": "newPrice", "type": "uint256" }], "name": "updatePrice", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "listForSale", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
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

// ✅ **내 NFT 목록 불러오기 (소유자 확인 포함)**
async function loadMyNFTs() {
  await connectWallet();
  const accounts = await web3.eth.getAccounts();
  const nftContainer = document.getElementById("nftContainer");
  nftContainer.innerHTML = "";
  document.getElementById("status").innerText = "NFT 불러오는 중...";

  // 📌 실제 소유한 NFT ID 가져오기
  const nftList = await getOwnedNFTs(accounts[0]);

  if (nftList.length === 0) {
    document.getElementById("status").innerText = "소유한 NFT가 없습니다.";
    return;
  }
  document.getElementById("status").innerText = "";

  // ✅ **NFT 개별 정보 불러오기 + 오류 처리**
  for (let tokenId of nftList) {
    try {
      console.log(`Fetching NFT info for Token ID: ${tokenId}`);
      const nft = await contract.methods.getNFTInfo(tokenId).call();
      const owner = await contract.methods.ownerOf(tokenId).call(); // ✅ NFT 소유자 확인
      console.log(`NFT ${tokenId}의 현재 소유자: ${owner}`);

      if (!nft || !nft.tokenURI) {
        console.error(`Error: NFT data is invalid for Token ID: ${tokenId}`);
        continue; // 🚨 데이터가 없으면 건너뜀
      }

      const nftElement = document.createElement("div");
      nftElement.classList.add("col-md-4", "mb-4");

      nftElement.innerHTML = `
        <div class="card shadow-sm">
          <img src="${nft.tokenURI}" class="card-img-top">
          <div class="card-body text-center">
            <h5 class="card-title">NFT #${tokenId}</h5>
            <p><b>가격:</b> ${web3.utils.fromWei(nft.price, "ether")} ETH</p>
            <p><b>소유자:</b> ${owner}</p>
            <div class="d-grid gap-2">
              <button class="btn btn-warning" onclick="changePrice(${tokenId})">가격 변경</button>
              <button class="btn btn-danger" onclick="burnNFT(${tokenId})">폐기</button>
              <button class="btn btn-success" onclick="listForSale(${tokenId})">판매 등록</button>
            </div>
          </div>
        </div>
      `;
      nftContainer.appendChild(nftElement);
    } catch (error) {
      console.error(`Error fetching NFT info for Token ID: ${tokenId}`, error);
    }
  }
}

// ✅ **특정 계정(Account 4)의 NFT 개수 확인**
async function checkAccountBalance(accountAddress) {
  try {
    const balance = await contract.methods.balanceOf(accountAddress).call();
    console.log(`📊 Account ${accountAddress}의 NFT 개수: ${balance}`);
    alert(`Account ${accountAddress}의 NFT 개수: ${balance}`);
  } catch (error) {
    console.error("❌ 계정 NFT 개수 조회 오류:", error);
  }
}

// ✅ **소유한 NFT 조회 (`totalSupply()` 없이 구현)**
async function getOwnedNFTs(ownerAddress) {
  try {
    const ownedNFTs = [];
    const maxTokenId = 100; // 🔥 최대 NFT 개수 (조절 가능)

    for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
      try {
        const nft = await contract.methods.getNFTInfo(tokenId).call();
        if (nft.owner.toLowerCase() === ownerAddress.toLowerCase()) {
          ownedNFTs.push(tokenId);
        }
      } catch (error) {
        console.warn(`NFT ${tokenId} 조회 실패: 존재하지 않거나 오류 발생`);
      }
    }

    console.log(`Owned NFTs: `, ownedNFTs);
    return ownedNFTs;
  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
    return [];
  }
}
