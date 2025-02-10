// ✅ Web3 및 컨트랙트 설정
const contractAddress = "0x449f12166923413c9273EfA8385D07D755aF7e6c"; // 최신 컨트랙트 주소
const contractABI = [
  {
    "inputs": [],
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
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "buyNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "NFTListedForSale",
    "type": "event"
  }
];

let web3;
let contract;

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask를 설치하세요!");
    return null;
  }
  web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  contract = new web3.eth.Contract(contractABI, contractAddress);
}

async function loadNFTListings() {
    await connectWallet();
    const nftContainer = document.querySelector(".container .row");
    nftContainer.innerHTML = ""; // 기존 목록 초기화
  
    try {
      for (let tokenId = 1; tokenId <= 100; tokenId++) { // NFT ID가 1~100까지 있다고 가정
        try {
          const nft = await contract.methods.getNFTInfo(tokenId).call();
          
          if (parseInt(nft.price) > 0) { // 판매 중인 NFT만 표시
            console.log(`📌 NFT ${tokenId} 정보:`, nft); // 디버깅 로그
  
            let metadata = {
              imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image",
              description: "설명이 없습니다."
            };
  
            if (nft.tokenURI.startsWith("ipfs://")) {
              nft.tokenURI = nft.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            }
  
            // ✅ 메타데이터 가져오기
            try {
              const response = await fetch(nft.tokenURI);
              if (response.ok) {
                const metadataJson = await response.json();
                metadata.imageUrl = metadataJson.image || metadata.imageUrl;
                metadata.description = metadataJson.description || metadata.description;
              }
            } catch (error) {
              console.error(`❌ NFT 메타데이터 로드 오류:`, error);
            }
  
            // ✅ NFT 가격 변환 (Wei → ETH)
            const priceInEther = web3.utils.fromWei(nft.price, "ether");
  
            // ✅ NFT 카드 UI 생성
            const nftElement = document.createElement("div");
            nftElement.classList.add("col-md-3", "col-sm-4", "my-3");
            nftElement.innerHTML = `
              <div class="card">
                  <img src="${metadata.imageUrl}" class="card-img-top" alt="NFT Image">
                  <div class="card-body">
                      <h5 class="card-title">${nft.tokenName || "이름 없음"}</h5>
                      <p><b>ID#:</b> ${tokenId}</p>
                      <p><b>가격:</b> ${priceInEther} ETH</p>
                      <p class="nft-description">${metadata.description}</p>
                      <button class="btn btn-primary buy-btn" data-id="${tokenId}" data-price="${nft.price}">구매하기</button>
                  </div>
              </div>
            `;
  
            // ✅ NFT 목록에 추가
            nftContainer.appendChild(nftElement);
          }
        } catch (error) {
          console.log(`NFT #${tokenId} 조회 오류 (판매 안된 NFT일 가능성 있음)`);
        }
      }
    } catch (error) {
      console.error("❌ 판매 중인 NFT 조회 오류:", error);
    }
  }
  

// ✅ NFT 구매 기능
async function buyNFT(event) {
  const tokenId = event.target.dataset.id;
  const price = event.target.dataset.price;

  if (!tokenId || !price) {
    alert("NFT 정보를 불러올 수 없습니다.");
    return;
  }

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    await contract.methods.buyNFT(tokenId).send({
      from: accounts[0],
      value: price,
      gas: 300000,
      gasPrice: await web3.eth.getGasPrice()
    });

    alert(`✅ NFT #${tokenId}를 성공적으로 구매하였습니다.`);
    loadNFTListings(); // 구매 후 목록 새로고침
  } catch (error) {
    console.error("❌ NFT 구매 오류:", error);
    alert("NFT 구매에 실패하였습니다.");
  }
}

// ✅ 버튼 이벤트 등록
document.addEventListener("DOMContentLoaded", function () {
  loadNFTListings();

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("buy-btn")) {
      buyNFT(event);
    }
  });
});
