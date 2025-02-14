const contractAddress = "0x2DE507FfC038eFc92C50Bc7Cf188fea546DaE64A";
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
let currentAccount = null; // ✅ NFT 보유 계정
let selectedBuyer = null;  // ✅ 구매 계정 (MetaMask에서 선택)

// ✅ MetaMask 연결
async function connectWallet() {
    if (!window.ethereum) {
        alert("❌ MetaMask가 설치되지 않았습니다.");
        return null;
    }

    try {
        console.log("🔹 MetaMask 연결 시도...");
        web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        if (!accounts || accounts.length === 0) {
            alert("❌ MetaMask 계정이 연결되지 않았습니다.");
            return null;
        }

        currentAccount = accounts[0]; // ✅ 현재 계정 저장
        contract = new web3.eth.Contract(contractABI, contractAddress);

        console.log(`✅ MetaMask 연결 완료! 현재 계정 (보유 계정): ${currentAccount}`);
        updateAccountUI();
        return currentAccount;
    } catch (error) {
        console.error("❌ MetaMask 연결 오류:", error);
        alert("MetaMask 연결 오류가 발생했습니다.");
        return null;
    }
}

// ✅ 계정 UI 업데이트
function updateAccountUI() {
    const accountElement = document.getElementById("currentAccount");
    if (accountElement) {
        accountElement.innerText = `현재 계정 (보유 계정): ${currentAccount}`;
    }
}

// ✅ MetaMask에서 계정 목록 불러오기 (구매 계정 선택)
async function loadAccounts() {
    if (!window.ethereum) {
        alert("❌ MetaMask가 설치되지 않았습니다.");
        return;
    }

    try {
        console.log("🔹 MetaMask 계정 목록 불러오기...");
        const accounts = await window.ethereum.request({ method: "eth_accounts" });

        if (!accounts || accounts.length === 0) {
            alert("❌ MetaMask 계정이 연결되지 않았습니다.");
            return;
        }

        const accountSelector = document.getElementById("accountSelector");
        accountSelector.innerHTML = "";

        accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account;
            option.innerText = account;
            accountSelector.appendChild(option);
        });

        selectedBuyer = accounts[0]; // ✅ 기본 구매 계정 설정
        accountSelector.addEventListener("change", (event) => {
            selectedBuyer = event.target.value;
            console.log(`✅ 선택된 구매 계정: ${selectedBuyer}`);
        });

        console.log("✅ 구매 계정 목록 불러오기 완료!");
    } catch (error) {
        console.error("❌ MetaMask 계정 불러오기 오류:", error);
    }
}

// ✅ 판매 중인 NFT 불러오기
async function loadNFTListings() {
    await connectWallet();
    const nftContainer = document.getElementById("listingNFTContainer");
    nftContainer.innerHTML = "";

    try {
        console.log("🔍 판매 중인 NFT 불러오기...");
        const totalNFTs = 100;

        for (let tokenId = 1; tokenId <= totalNFTs; tokenId++) {
            try {
                const nft = await contract.methods.getNFTInfo(tokenId).call();
                if (parseInt(nft.price) > 0) {
                    console.log(`📌 판매 중인 NFT ${tokenId} 정보:`, nft);

                    let metadata = { imageUrl: "", description: "설명이 없습니다." };

                    if (nft.tokenURI.startsWith("ipfs://")) {
                        nft.tokenURI = nft.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                    }

                    try {
                        const response = await fetch(nft.tokenURI);
                        if (response.ok) {
                            const metadataJson = await response.json();
                            metadata.imageUrl = metadataJson.image || "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image";
                            metadata.description = metadataJson.description || "설명이 없습니다.";
                        }
                    } catch (error) {
                        console.error(`❌ NFT 메타데이터 로드 오류:`, error);
                    }

                    const priceInEther = web3.utils.fromWei(nft.price, "ether");

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

async function buyNFT(tokenId, price) {
    try {
        if (!selectedBuyer) {
            alert("❌ 구매할 계정을 선택하세요.");
            return;
        }

        console.log(`🛒 NFT 구매 시도: ID ${tokenId}, 가격 ${price} ETH, 구매 계정: ${selectedBuyer}`);

        const gasPrice = await web3.eth.getGasPrice();
        console.log(`⛽ Gas 가격: ${gasPrice}`);

        const transaction = await contract.methods.buyNFT(tokenId).send({
            from: selectedBuyer,
            value: web3.utils.toWei(price, "ether"),
            gas: 300000,
            gasPrice: gasPrice
        });

        console.log(`✅ 트랜잭션 성공: ${transaction.transactionHash}`);
        alert(`✅ NFT #${tokenId}를 ${selectedBuyer} 계정으로 성공적으로 구매하였습니다!`);

        // 🔥 구매 후 목록 업데이트 실행
        setTimeout(() => {
            loadPurchasedNFTs();  // ✅ 구매한 NFT 목록 새로 불러오기
            loadNFTListings();    // ✅ 판매 중인 NFT 목록 새로 불러오기
        }, 5000);

    } catch (error) {
        console.error("❌ [NFT 구매 오류]", error);
        alert("NFT 구매에 실패하였습니다. 오류 로그를 확인하세요.");
    }
}


async function loadPurchasedNFTs() {
    if (!selectedBuyer) {
        alert("❌ 구매할 계정을 선택하세요.");
        return;
    }

    console.log(`🔹 구매한 NFT 불러오기: ${selectedBuyer}`);

    try {
        const purchasedNFTContainer = document.getElementById("purchasedNFTContainer");
        purchasedNFTContainer.innerHTML = ""; // 기존 목록 초기화

        const myNFTs = await contract.methods.getOwnedNFTs(selectedBuyer).call();

        if (!myNFTs || myNFTs.length === 0) {
            console.log("🔍 구매한 NFT 없음");
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
        document.getElementById("purchasedNFTContainer").innerHTML = "<p class='text-center text-danger'>❌ 오류 발생: 구매한 NFT를 불러올 수 없습니다.</p>";
    }
}


// ✅ 구매 버튼 이벤트 리스너 추가
document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("buy-btn")) {
        console.log("🛒 구매 버튼 클릭됨!");
        const tokenId = event.target.dataset.id;
        const priceInWei = event.target.dataset.price;

        if (!tokenId || !priceInWei) {
            alert("NFT 정보를 불러올 수 없습니다.");
            return;
        }

        const priceInEther = web3.utils.fromWei(priceInWei, "ether");

        if (confirm(`NFT #${tokenId}을 ${priceInEther} ETH에 구매하시겠습니까?`)) {
            await buyNFT(tokenId, priceInEther);
        }
    }
});

document.addEventListener("DOMContentLoaded", function () {
    loadNFTListings();
    loadAccounts(); 

    document.getElementById("showPurchasedNFTs").addEventListener("click", function () {
        loadPurchasedNFTs(); // ✅ NFT 불러오기 버튼 클릭 시 실행
    });

    if (window.ethereum) {
        window.ethereum.on("accountsChanged", async function (newAccounts) {
            console.log("🔄 MetaMask 계정 변경됨:", newAccounts[0]);
            await loadNFTListings();
            await loadPurchasedNFTs();
        });
    }
});
