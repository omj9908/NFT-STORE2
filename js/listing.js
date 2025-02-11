const contractAddress = "0xD85944D670c1d3fA86650862982D27e976EeD02B";
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
  const nftContainer = document.getElementById("listingNFTContainer");
  nftContainer.innerHTML = ""; // 기존 목록 초기화

  try {
      const totalNFTs = 100; // 조회할 최대 NFT 개수

      for (let tokenId = 1; tokenId <= totalNFTs; tokenId++) {
          try {
              const nft = await contract.methods.getNFTInfo(tokenId).call();
              
              if (parseInt(nft.price) > 0) { // 🔹 판매 중인 NFT만 표시
                  console.log(`📌 NFT ${tokenId} 정보:`, nft);

                  let metadata = {
                      imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image",
                      description: "설명이 없습니다."
                  };

                  if (nft.tokenURI.startsWith("ipfs://")) {
                      nft.tokenURI = nft.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                  }

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

                  const priceInEther = web3.utils.fromWei(nft.price, "ether");

                  // 📌 NFT 카드 HTML 구조 (구매하기 + 세부정보 버튼 포함)
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
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary buy-btn" data-id="${tokenId}" data-price="${nft.price}">구매하기</button>
                                <button class="btn btn-info view-details-btn" data-id="${tokenId}" data-bs-toggle="modal" data-bs-target="#nftInfoModal">세부 정보</button>
                            </div>
                        </div>
                    </div>
                  `;

                  nftContainer.appendChild(nftElement);
              }
          } catch (error) {
              console.log(`NFT #${tokenId} 조회 오류 (판매되지 않은 NFT일 가능성 있음)`);
          }
      }
  } catch (error) {
      console.error("❌ 판매 중인 NFT 조회 오류:", error);
  }
}

async function buyNFT(event) {
    const tokenId = event.target.dataset.id;
    const price = event.target.dataset.price;

    if (!tokenId || !price) {
        alert("NFT 정보를 불러올 수 없습니다.");
        return;
    }

    console.log(`🛒 NFT 구매 시도: ID ${tokenId}, 가격 ${price} WEI`); // 🛠 디버깅 로그 추가

    await connectWallet();
    const accounts = await web3.eth.getAccounts();

    try {
        console.log(`🔹 트랜잭션 시작: ${accounts[0]} 계정에서 구매`);
        const gasPrice = await web3.eth.getGasPrice();
        
        await contract.methods.buyNFT(tokenId).send({
            from: accounts[0],
            value: price,
            gas: 300000,
            gasPrice: gasPrice
        });

        alert(`✅ NFT #${tokenId}를 성공적으로 구매하였습니다!`);

        // 🔥 구매 후 내 NFT 목록 다시 불러오기
        setTimeout(() => {
            loadPurchasedNFTs(); 
            loadNFTListings();  // 판매 목록 업데이트
        }, 5000);  // 네트워크 반영까지 기다린 후 실행 (5초)
        
    } catch (error) {
        console.error("❌ NFT 구매 오류:", error);
        alert("NFT 구매에 실패하였습니다.");
    }
}

async function loadPurchasedNFTs() {
    await connectWallet();
    const accounts = await web3.eth.getAccounts();
    const purchasedNFTContainer = document.getElementById("purchasedNFTContainer");
    purchasedNFTContainer.innerHTML = "";

    console.log(`🔹 구매한 NFT 불러오기: ${accounts[0]}`);

    try {
        const myNFTs = await contract.methods.getOwnedNFTs().call({ from: accounts[0] });

        if (!myNFTs || myNFTs.length === 0) {
            purchasedNFTContainer.innerHTML = "<p class='text-center'>🛍️ 아직 구매한 NFT가 없습니다.</p>";
            return;
        }

        for (let tokenId of myNFTs) {
            try {
                const nft = await contract.methods.getNFTInfo(tokenId).call();
                console.log(`✅ 내가 구매한 NFT ${tokenId} 정보:`, nft);

                let metadata = { 
                    imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image", 
                    description: "설명이 없습니다." 
                };

                if (nft.tokenURI.startsWith("ipfs://")) {
                    nft.tokenURI = nft.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                }

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

                const priceInEther = nft.price > 0 ? web3.utils.fromWei(nft.price, "ether") : "판매되지 않음";

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
                        </div>
                    </div>
                `;

                purchasedNFTContainer.appendChild(nftElement);
            } catch (error) {
                console.error(`❌ NFT 정보 조회 오류:`, error);
            }
        }
    } catch (error) {
        console.error("❌ 구매한 NFT 조회 오류:", error);
        purchasedNFTContainer.innerHTML = "<p class='text-center text-danger'>❌ 오류 발생: 구매한 NFT를 불러올 수 없습니다.</p>";
    }
}


async function viewNFTDetails(tokenId) {
    await connectWallet();
    try {
        const nft = await contract.methods.getNFTInfo(tokenId).call();
        console.log(`🔍 NFT ${tokenId} 세부정보:`, nft);

        let imageUrl = nft.tokenURI;
        let description = "설명이 없습니다.";

        // ✅ IPFS URL 변환
        if (imageUrl.startsWith("ipfs://")) {
            imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        }

        // ✅ JSON 메타데이터 처리
        if (imageUrl.endsWith(".json") || imageUrl.includes("pinata")) {
            const metadata = await fetchImageFromMetadata(imageUrl);
            imageUrl = metadata.imageUrl;
            description = metadata.description;
        }

        console.log(`🖼️ 최종 NFT 이미지 URL: ${imageUrl}`);
        console.log(`📌 NFT 설명: ${description}`);

        const ownerShort = `${nft.owner.substring(0, 6)}...${nft.owner.substring(nft.owner.length - 4)}`;

        // ✅ 모달에 데이터 설정
        document.getElementById("nftImage").src = imageUrl;
        document.getElementById("nftId").innerText = `${tokenId}`;
        document.getElementById("nftName").innerText = `${nft.tokenName || "이름 없음"}`;
        document.getElementById("nftPrice").innerText = `${nft.price > 0 ? `${web3.utils.fromWei(nft.price, "ether")} ETH` : "판매되지 않음"}`;
        document.getElementById("nftOwner").innerText = `${ownerShort}`;
        document.getElementById("nftDescription").innerText = `${description}`;

        // ✅ 모달 표시
        const modalElement = document.getElementById("nftInfoModal");
        modalElement.style.display = "block";
        modalElement.classList.add("show");
        modalElement.removeAttribute("aria-hidden");
        modalElement.setAttribute("aria-modal", "true");
        modalElement.focus();

        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();

        // ✅ 모달이 닫힐 때 `modal-backdrop` 제거 및 스크롤 복구
        modalElement.addEventListener("hidden.bs.modal", function () {
            document.body.classList.remove("modal-open"); // 모달 열림 상태 해제
            document.querySelectorAll(".modal-backdrop").forEach(el => el.remove()); // 🔥 어두운 배경 제거
            document.body.style.overflow = ""; // 🔥 스크롤 복구
        });

    } catch (error) {
        console.error("❌ NFT 정보 조회 오류:", error);
        alert("NFT 정보를 불러오는 데 실패했습니다.");
    }
}


async function fetchImageFromMetadata(tokenURI) {
    console.log(`🔍 Fetching metadata from: ${tokenURI}`);

    try {
        if (tokenURI.startsWith("ipfs://")) {
            tokenURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
        }

        if (tokenURI.endsWith(".json") || tokenURI.includes("pinata")) {
            const response = await fetch(tokenURI);
            if (!response.ok) {
                throw new Error(`Failed to fetch metadata: ${response.status}`);
            }
            const metadata = await response.json();
            console.log("📌 NFT Metadata:", metadata);

            let imageUrl = metadata.image || "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image";
            let description = metadata.description || "설명이 없습니다.";

            if (imageUrl.startsWith("ipfs://")) {
                imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            }

            return { imageUrl, description };
        }

        return { imageUrl: tokenURI, description: "설명이 없습니다." };
    } catch (error) {
        console.error("❌ NFT 메타데이터 로드 오류:", error);
        return {
            imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image",
            description: "설명 없음",
        };
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadNFTListings();
    loadPurchasedNFTs();

    document.getElementById("showPurchasedNFTs").addEventListener("click", function () {
        const purchasedNFTContainer = document.getElementById("purchasedNFTContainer");

        if (purchasedNFTContainer.style.display === "none") {
            purchasedNFTContainer.style.display = "flex";
            loadPurchasedNFTs();
            this.innerText = "내가 구매한 NFT 숨기기";
        } else {
            purchasedNFTContainer.style.display = "none";
            this.innerText = "내가 구매한 NFT 보기";
        }
    });

    // ✅ 세부 정보 버튼 클릭 이벤트 추가
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("view-details-btn")) {
            const tokenId = event.target.dataset.id;
            console.log(`🔍 NFT 세부 정보 요청: Token ID ${tokenId}`);
            viewNFTDetails(tokenId);
        }
    });

    // ✅ 구매 버튼 클릭 이벤트 추가 (구매 버튼이 작동하도록 설정)
    document.addEventListener("click", async function (event) {
        if (event.target.classList.contains("buy-btn")) {
            console.log("🛒 구매 버튼 클릭됨!");
            await buyNFT(event);
        }
    });

    // ✅ 모달이 닫힐 때 `modal-backdrop`을 완전히 제거하고 스크롤 복구
    document.getElementById("nftInfoModal").addEventListener("hidden.bs.modal", function () {
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
        document.body.style.overflow = "";
    });
});
