const contractAddress = "0x2DE507FfC038eFc92C50Bc7Cf188fea546DaE64A"; 
const contractABI = [
  {
    "inputs": [],
    "name": "owner", 
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
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
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "newName", "type": "string" }
    ],
    "name": "setNFTName",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "burnNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "listNFTForSale",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "updateNFTPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "withdrawFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];


let web3;
let contract;
let currentAccount = null;


async function connectWallet(showPopup = false) {
  if (!window.ethereum) {
    alert("❌ MetaMask가 설치되지 않았습니다.");
    return null;
  }

  try {
    if (showPopup) {
      // ✅ MetaMask 로그인 창 띄우기 (사용자가 계정을 선택할 수 있도록)
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
    }

    // ✅ 현재 계정 정보 가져오기 (로그인 팝업 없이)
    const selectedAccounts = await window.ethereum.request({ method: "eth_accounts" });

    if (!selectedAccounts || selectedAccounts.length === 0) {
      alert("❌ MetaMask 계정이 연결되지 않았습니다.");
      return null;
    }

    const selectedAccount = selectedAccounts[0];

    if (currentAccount !== selectedAccount) {
      console.log(`🔄 MetaMask 계정 변경 감지! 이전 계정: ${currentAccount}, 새 계정: ${selectedAccount}`);
      currentAccount = selectedAccount;
      updateUIAccount(); // UI 업데이트
    } else {
      console.log(`✅ 동일한 계정 사용 중: ${currentAccount}`);
    }

    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(contractABI, contractAddress);

    return selectedAccount;
  } catch (error) {
    console.error("❌ MetaMask 연결 실패:", error);
    return null;
  }
}

function updateUIAccount() {
  const accountElement = document.getElementById("currentAccount");
  if (accountElement) {
    accountElement.innerText = `현재 계정: ${currentAccount || "연결되지 않음"}`;
  }
}

// ✅ MetaMask 계정 변경 감지
if (window.ethereum) {
  window.ethereum.on("accountsChanged", async function (newAccounts) {
    if (!newAccounts || newAccounts.length === 0) {
      console.log("❌ MetaMask 계정이 로그아웃됨.");
      currentAccount = null;
      updateUIAccount();
      return;
    }

    console.log("🔄 MetaMask 계정 변경 감지됨:", newAccounts[0]);

    currentAccount = newAccounts[0];
    updateUIAccount();
    loadMyNFTs(); // 계정 변경 시 자동으로 내 NFT 불러오기
  });
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

async function loadMyNFTs() {
  // ✅ 현재 계정 가져오기 (팝업 없이 확인)
  let userAddress = await connectWallet(false);

  // ✅ MetaMask 로그인 여부 확인
  if (!userAddress) {
    alert("❌ MetaMask에 로그인해야 NFT를 불러올 수 있습니다.");
    return;
  }

  console.log(`🛍️ 현재 계정(${userAddress})의 NFT 목록 불러오기...`);

  try {
    const nftList = await contract.methods.getOwnedNFTs(userAddress).call();
    console.log(`🛍️ 내 NFT 목록:`, nftList);

    const nftContainer = document.getElementById("nftContainer");
    nftContainer.innerHTML = "";

    if (!Array.isArray(nftList) || nftList.length === 0) {
      document.getElementById("status").innerText = "소유한 NFT가 없습니다.";
      return;
    }

    for (let tokenId of nftList) {
      try {
        const nft = await contract.methods.getNFTInfo(tokenId).call();
        console.log(`📌 NFT ${tokenId} 정보:`, nft);

        let metadata = {
          imageUrl: nft.tokenURI.startsWith("ipfs://")
            ? nft.tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
            : nft.tokenURI,
          description: "설명 없음"
        };

        // ✅ 메타데이터 로드
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

        // ✅ NFT 카드 생성
        const nftElement = document.createElement("div");
        nftElement.classList.add("col-md-4", "mb-4");

        nftElement.innerHTML = `
          <div class="card shadow-sm">
            <img src="${metadata.imageUrl}" class="card-img-top">
            <div class="card-body text-center">
              <h5 class="card-title">NFT #${tokenId} - ${nft.tokenName || "이름 없음"}</h5>
              <p><b>판매 가격:</b> ${priceInEther} ETH</p>
              <p><b>설명:</b> ${metadata.description}</p>
              <div class="d-grid gap-2">
                <button class="btn btn-info" onclick="viewNFTDetails(${tokenId})">세부정보</button>
                <button class="btn btn-primary" onclick="openNameChangeModal(${tokenId})">이름 변경</button>
                <button class="btn btn-warning" onclick="openPriceChangeModal(${tokenId}, ${nft.price || 0})">가격 변경</button>
                <button class="btn btn-danger" onclick="burnNFT(${tokenId})">폐기</button>
                ${nft.price == 0 
                  ? `<button class="btn btn-success" onclick="listNFTForSale(${tokenId})">판매 등록</button>` 
                  : ""
                }
              </div>
            </div>
          </div>
        `;

        nftContainer.appendChild(nftElement);
      } catch (error) {
        console.error(`❌ NFT 정보 조회 오류 (ID: ${tokenId}):`, error);
      }
    }
  } catch (error) {
    console.error("❌ [오류] 내 NFT 목록 조회 실패:", error);
    document.getElementById("status").innerText = "NFT 조회 오류 발생!";
  }
}


async function viewNFTDetails(tokenId) {
  await connectWallet();
  try {
    const nft = await contract.methods.getNFTInfo(tokenId).call();
    console.log(`🔍 NFT ${tokenId} 세부정보:`, nft);

    let imageUrl = nft.tokenURI;
    let description = "설명이 없습니다.";

    if (imageUrl.startsWith("ipfs://")) {
      imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    if (imageUrl.endsWith(".json") || imageUrl.includes("pinata")) {
      const metadata = await fetchImageFromMetadata(imageUrl);
      imageUrl = metadata.imageUrl;
      description = metadata.description;
    }

    console.log(`🖼️ 최종 NFT 이미지 URL: ${imageUrl}`);
    console.log(`📌 NFT 설명: ${description}`);

    const ownerShort = `${nft.owner.substring(0, 6)}...${nft.owner.substring(nft.owner.length - 4)}`;

    document.getElementById("nftImage").src = imageUrl;
    document.getElementById("nftId").innerText = `${tokenId}`;
    document.getElementById("nftName").innerText = `${nft.tokenName || "이름 없음"}`;
    document.getElementById("nftPrice").innerText = `${nft.price > 0 ? `${web3.utils.fromWei(nft.price, "ether")} ETH` : "판매되지 않음"}`;
    document.getElementById("nftOwner").innerText = `${ownerShort}`;
    document.getElementById("nftDescription").innerText = `${description}`; 

    const modalElement = document.getElementById("nftInfoModal");
    modalElement.style.display = "block";
    modalElement.classList.add("show");
    modalElement.removeAttribute("aria-hidden");
    modalElement.setAttribute("aria-modal", "true");
    modalElement.focus(); 

    new bootstrap.Modal(modalElement).show();

  } catch (error) {
    console.error("❌ NFT 정보 조회 오류:", error);
    alert("NFT 정보를 불러오는 데 실패했습니다.");
  }
}

function openNameChangeModal(tokenId) {
  console.log("📌 이름 변경 모달 실행됨:", tokenId);

  const modalElement = document.getElementById("nameChangeModal");
  const tokenIdField = document.getElementById("modalTokenId");
  const newNameField = document.getElementById("newNFTName");

  if (!modalElement || !tokenIdField || !newNameField) {
    console.error("❌ 오류: 모달 요소를 찾을 수 없습니다!");
    alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
    return;
  }

  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  newNameField.value = ""; 
  newNameField.style.display = "block";
  newNameField.style.visibility = "visible";
  newNameField.style.opacity = "1";

  tokenIdField.value = tokenId;

  modalInstance.show();

  console.log("✅ 모달이 정상적으로 열렸습니다.");
}

async function changeNFTName() {
  console.log("📌 NFT 이름 변경 실행");

  const tokenIdField = document.getElementById("modalTokenId");
  const newNameField = document.getElementById("newNFTName");

  if (!tokenIdField || !newNameField) {
      console.error("❌ NFT 이름 변경 오류: `modalTokenId` 또는 `newNFTName` 요소가 없습니다.");
      alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
      return;
  }

  const tokenId = tokenIdField.value;
  const newName = newNameField.value.trim();

  if (!newName) {
      alert("NFT 이름을 입력하세요!");
      newNameField.focus();
      newNameField.style.border = "2px solid red";
      return;
  }

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
      const gasPrice = await web3.eth.getGasPrice();

      await contract.methods.setNFTName(tokenId, newName).send({
          from: accounts[0],
          value: web3.utils.toWei("0.01", "ether"), 
          gas: 300000,
          gasPrice: gasPrice 
      });

      alert(`✅ NFT #${tokenId}의 이름이 "${newName}"으로 변경되었습니다.`);

      const modalElement = document.getElementById("nameChangeModal");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide(); 

      document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());

      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");

      setTimeout(() => {
          loadMyNFTs();
      }, 500);

  } catch (error) {
      console.error("❌ NFT 이름 변경 오류:", error);
      alert("NFT 이름 변경 실패! 가스를 확인하세요.");
  }
}

async function listNFTForSale(tokenId) {
  const price = prompt("판매 가격을 ETH 단위로 입력하세요:");
  if (!price) return;

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    await contract.methods.listNFTForSale(tokenId, web3.utils.toWei(price, "ether")).send({
      from: accounts[0],
      gasPrice: await web3.eth.getGasPrice() // EIP-1559 문제 해결
    });
    alert(`✅ NFT #${tokenId}이 ${price} ETH에 판매 등록되었습니다.`);
    loadMyNFTs();
  } catch (error) {
    console.error("❌ NFT 판매 등록 오류:", error);
    alert("NFT 판매 등록 실패!");
  }
}

async function burnNFT(tokenId) {
  if (!confirm(`⚠️ NFT #${tokenId}을 영구적으로 삭제하시겠습니까?`)) return;

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    await contract.methods.burnNFT(tokenId).send({
      from: accounts[0],
      gasPrice: await web3.eth.getGasPrice() // EIP-1559 문제 해결
    });
    alert(`🔥 NFT #${tokenId}가 삭제되었습니다.`);
    loadMyNFTs();
  } catch (error) {
    console.error("❌ NFT 삭제 오류:", error);
    alert("NFT 삭제 실패! 소유자만 삭제할 수 있습니다.");
  }
}
function openPriceChangeModal(tokenId, currentPrice) {
  console.log("📌 가격 변경 모달 실행:", tokenId, currentPrice);

  const modalElement = document.getElementById("myModalChangePrice");
  const tokenIdField = document.getElementById("myID");
  const oldPriceField = document.getElementById("oldPrice");
  const newPriceField = document.getElementById("newPrice");

  if (!modalElement || !tokenIdField || !oldPriceField || !newPriceField) {
    console.error("❌ 오류: 가격 변경 모달 요소를 찾을 수 없습니다!");
    alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
    return;
  }

  tokenIdField.value = tokenId;

  try {
    const priceInEther = web3.utils.fromWei(BigInt(currentPrice).toString(), "ether");
    oldPriceField.value = `${priceInEther} ETH`;
  } catch (error) {
    console.error("❌ 가격 변환 오류:", error);
    oldPriceField.value = "변환 오류";
  }

  newPriceField.value = "";

  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }
  modalInstance.show();
}


async function confirmPriceChange() {
  const tokenId = document.getElementById("myID").value;
  const newPrice = document.getElementById("newPrice").value.trim();

  if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
    alert("유효한 가격을 입력하세요!");
    return;
  }

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    console.log(`🔹 가격 변경 실행: NFT #${tokenId}, 새로운 가격: ${newPrice} ETH`);

    const newPriceInWei = web3.utils.toWei(newPrice, "ether");

    await contract.methods.updateNFTPrice(tokenId, newPriceInWei).send({
      from: accounts[0],
      gas: 300000,
      gasPrice: await web3.eth.getGasPrice()
    });

    alert(`✅ NFT #${tokenId} 가격이 ${newPrice} ETH로 변경되었습니다.`);

    const priceChangeModal = bootstrap.Modal.getInstance(document.getElementById("myModalChangePrice"));
    if (priceChangeModal) priceChangeModal.hide();

    loadMyNFTs();
  } catch (error) {
    console.error("❌ NFT 가격 변경 오류:", error);
    alert("NFT 가격 변경 실패! 본인 소유인지 확인하세요.");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("✅ 문서가 로드됨!");

  // ✅ 현재 계정 정보만 가져오기 (팝업 없이)
  currentAccount = await connectWallet(false);
  updateUIAccount();

  // ✅ '내 NFT 불러오기' 버튼 이벤트 추가
  const loadNFTsButton = document.getElementById("loadNFTsBtn");
  if (loadNFTsButton) {
    loadNFTsButton.addEventListener("click", async () => {
      console.log("🛍️ '내 NFT 불러오기' 버튼 클릭됨!");
      
      // ✅ 버튼을 눌렀을 때만 로그인 창이 뜨도록 수정
      currentAccount = await connectWallet(true);
      
      if (currentAccount) {
        await loadMyNFTs();
      } else {
        alert("❌ MetaMask 계정이 연결되지 않았습니다.");
      }
    });

    console.log("✅ '내 NFT 불러오기' 버튼에 이벤트 추가됨!");
  } else {
    console.warn("⚠️ '내 NFT 불러오기' 버튼을 찾을 수 없습니다! HTML 파일을 확인하세요.");
  }
});
