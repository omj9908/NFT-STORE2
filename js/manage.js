const contractAddress = "0xA2A5d9D4691B6F11C5C5C4273440bBDd4B7080A1"; // ✅ 최신 컨트랙트 주소
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
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "setNFTName",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    // ✅ **NFT 가격 변경 함수 추가**
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "newPrice", "type": "uint256" }
    ],
    "name": "updateNFTPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
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

// ✅ **NFT 메타데이터에서 이미지 & 설명 가져오기 (최종 수정)**
async function fetchImageFromMetadata(tokenURI) {
  console.log(`🔍 Fetching metadata from: ${tokenURI}`);

  try {
    // ✅ IPFS URL 변환
    if (tokenURI.startsWith("ipfs://")) {
      tokenURI = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    // ✅ JSON 파일인지 확인하고 메타데이터 가져오기
    if (tokenURI.endsWith(".json") || tokenURI.includes("pinata")) {
      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
      const metadata = await response.json();
      console.log("📌 NFT Metadata:", metadata);

      // ✅ 메타데이터에서 이미지 & 설명 가져오기
      let imageUrl = metadata.image || "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image";
      let description = metadata.description || "설명이 없습니다.";

      // ✅ IPFS 이미지 URL 변환
      if (imageUrl.startsWith("ipfs://")) {
        imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
      }

      return { imageUrl, description }; // ✅ 이미지와 설명을 함께 반환
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
        const nft = await contract.methods.getNFTInfo(tokenId).call();
        console.log(`📌 NFT ${tokenId} 정보:`, nft);

        let metadata = { imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image", description: "설명이 없습니다." };

        if (nft.tokenURI) {
          console.log(`🌍 Original tokenURI: ${nft.tokenURI}`);

          if (nft.tokenURI.startsWith("ipfs://") || nft.tokenURI.endsWith(".json") || nft.tokenURI.includes("pinata")) {
            metadata = await fetchImageFromMetadata(nft.tokenURI);
          } else {
            metadata.imageUrl = nft.tokenURI;
          }
        }

        console.log(`✅ 최종 NFT 이미지 URL: ${metadata.imageUrl}`);

        // ✅ NFT 카드 UI 생성
        const nftElement = document.createElement("div");
        nftElement.classList.add("col-md-4", "mb-4");

        nftElement.innerHTML = `
          <div class="card shadow-sm">
            <img src="${metadata.imageUrl}" class="card-img-top" 
              onerror="this.onerror=null;this.src='https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image'">
            <div class="card-body text-center">
              <h5 class="card-title">NFT #${tokenId} - ${nft.tokenName || "이름 없음"}</h5>
              <p><b>판매 가격:</b> ${nft.price > 0 ? `${web3.utils.fromWei(nft.price, "ether")} ETH` : "판매되지 않음"}</p>
              <p><b>설명:</b> ${metadata.description}</p> <!-- ✅ 설명 추가 -->
              <div class="d-grid gap-2">
                <button class="btn btn-info" onclick="viewNFTDetails(${tokenId})">세부정보</button>
                <button class="btn btn-primary" onclick="changeNFTName(${tokenId})">이름 변경</button>
                <button class="btn btn-warning" onclick="openPriceChangeModal(${tokenId}, ${nft.price})">가격 변경</button>
                <button class="btn btn-danger" onclick="burnNFT(${tokenId})">폐기</button>
                ${nft.price == 0 
          ? `<button class="btn btn-success" onclick="listNFTForSale(${tokenId})">판매 등록</button>` 
          : ""
        }
              </div>
            </div>
          </div>
        `;

        // ✅ NFT 목록에 추가
        nftContainer.appendChild(nftElement);
      } catch (error) {
        console.error(`❌ NFT 정보 조회 오류:`, error);
      }
    }
  } catch (error) {
    console.error("❌ 소유한 NFT 조회 오류:", error);
    document.getElementById("status").innerText = "NFT 조회 오류 발생!";
  }
}


async function viewNFTDetails(tokenId) {
  await connectWallet();
  try {
    const nft = await contract.methods.getNFTInfo(tokenId).call();
    console.log(`🔍 NFT ${tokenId} 세부정보:`, nft);

    // ✅ 기본값 설정
    let imageUrl = nft.tokenURI;
    let description = "설명이 없습니다.";

    // ✅ IPFS 이미지 URL 변환
    if (imageUrl.startsWith("ipfs://")) {
      imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }

    // ✅ JSON 파일인 경우 메타데이터에서 이미지 & 설명 가져오기
    if (imageUrl.endsWith(".json") || imageUrl.includes("pinata")) {
      const metadata = await fetchImageFromMetadata(imageUrl);
      imageUrl = metadata.imageUrl;
      description = metadata.description;
    }

    console.log(`🖼️ 최종 NFT 이미지 URL: ${imageUrl}`);
    console.log(`📌 NFT 설명: ${description}`);

    // ✅ 소유자 주소를 짧게 표시 (ex: 0x1234...5678)
    const ownerShort = `${nft.owner.substring(0, 6)}...${nft.owner.substring(nft.owner.length - 4)}`;

    // ✅ NFT 모달 정보 설정
    document.getElementById("nftImage").src = imageUrl;
    document.getElementById("nftId").innerText = `${tokenId}`;
    document.getElementById("nftName").innerText = `${nft.tokenName || "이름 없음"}`;
    document.getElementById("nftPrice").innerText = `${nft.price > 0 ? `${web3.utils.fromWei(nft.price, "ether")} ETH` : "판매되지 않음"}`;
    document.getElementById("nftOwner").innerText = `${ownerShort}`;
    document.getElementById("nftDescription").innerText = `${description}`; // ✅ 설명 추가

    // ✅ 모달을 강제로 활성화 & aria-hidden 제거
    const modalElement = document.getElementById("nftInfoModal");
    modalElement.style.display = "block";
    modalElement.classList.add("show");
    modalElement.removeAttribute("aria-hidden");
    modalElement.setAttribute("aria-modal", "true");
    modalElement.focus(); // ✅ 접근성을 위해 포커스 이동

    // ✅ Bootstrap 모달 실행
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
    console.error("❌ 오류: 이름 변경 모달 요소를 찾을 수 없습니다!");
    alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
    return;
  }

  // ✅ 토큰 ID 설정
  tokenIdField.value = tokenId;
  newNameField.value = ""; // 기존 입력값 초기화

  // ✅ 모달 열기
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}



// ✅ **NFT 이름 변경 실행**
async function changeNFTName() {
  console.log("📌 NFT 이름 변경 실행");

  // ✅ 요소 가져오기
  const tokenIdField = document.getElementById("modalTokenId");
  const newNameField = document.getElementById("newNFTName");

  // ✅ 요소 존재 여부 확인
  if (!tokenIdField || !newNameField) {
    console.error("❌ NFT 이름 변경 오류: `modalTokenId` 또는 `newNFTName` 요소가 없습니다.");
    alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
    return;
  }

  const tokenId = tokenIdField.value;
  const newName = newNameField.value.trim();

  if (!newName) {
    alert("NFT 이름을 입력하세요!");
    return;
  }

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    await contract.methods.setNFTName(tokenId, newName).send({
      from: accounts[0],
      gasPrice: await web3.eth.getGasPrice()
    });

    alert(`✅ NFT #${tokenId}의 이름이 "${newName}"으로 변경되었습니다.`);

    // ✅ 모달 닫기
    const nameChangeModal = bootstrap.Modal.getInstance(document.getElementById("nameChangeModal"));
    if (nameChangeModal) nameChangeModal.hide();

    loadMyNFTs(); // ✅ 변경된 이름을 반영하기 위해 목록 새로고침
  } catch (error) {
    console.error("❌ NFT 이름 변경 오류:", error);
    alert("NFT 이름 변경 실패! 본인 소유인지 확인하세요.");
  }
}


// ✅ **NFT 판매 등록 (EIP-1559 문제 해결)**
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

// ✅ **NFT 폐기 (EIP-1559 문제 해결)**
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

// ✅ **NFT 가격 변경 모달 열기**
function openPriceChangeModal(tokenId, currentPrice) {
  console.log("📌 가격 변경 모달 실행:", tokenId, currentPrice);

  // ✅ 가격 변경 모달 요소가 존재하는지 확인
  const modalElement = document.getElementById("myModalChangePrice");
  const tokenIdField = document.getElementById("myID");
  const oldPriceField = document.getElementById("oldPrice");

  if (!modalElement || !tokenIdField || !oldPriceField) {
    console.error("❌ 오류: 가격 변경 모달 요소를 찾을 수 없습니다!");
    alert("오류 발생! 페이지를 새로고침한 후 다시 시도하세요.");
    return;
  }

  // ✅ 가격 변경 모달 필드 값 설정
  tokenIdField.value = tokenId;
  oldPriceField.value = web3.utils.fromWei(currentPrice.toString(), "ether") + " ETH";

  // ✅ Bootstrap 모달 열기
  const priceChangeModal = new bootstrap.Modal(modalElement);
  priceChangeModal.show();
}

async function confirmPriceChange() {
  const tokenId = document.getElementById("myID").value;
  const newPrice = document.getElementById("newPrice").value;
  const oldPriceText = document.getElementById("oldPrice").value;

  if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
    alert("유효한 가격을 입력하세요!");
    return;
  }

  const oldPrice = parseFloat(oldPriceText.replace(" ETH", "").trim());
  const newPriceFloat = parseFloat(newPrice);

  if (oldPrice === newPriceFloat) {
    alert("❌ 기존 가격과 동일한 가격입니다! 다른 가격을 입력하세요.");
    return;
  }

  await connectWallet();
  const accounts = await web3.eth.getAccounts();

  try {
    // ✅ `updateNFTPrice` 함수가 존재하는지 확인 후 실행
    if (!contract.methods.updateNFTPrice) {
      console.error("❌ 오류: 컨트랙트에 updateNFTPrice 함수가 없습니다!");
      alert("스마트 컨트랙트에 가격 변경 함수가 없습니다.");
      return;
    }

    await contract.methods.updateNFTPrice(tokenId, web3.utils.toWei(newPrice, "ether")).send({
      from: accounts[0],
      gasPrice: await web3.eth.getGasPrice()
    });

    alert(`✅ NFT #${tokenId} 가격이 ${newPrice} ETH로 변경되었습니다.`);

    // ✅ 변경 완료 후 모달 닫기
    const priceChangeModal = bootstrap.Modal.getInstance(document.getElementById("myModalChangePrice"));
    if (priceChangeModal) priceChangeModal.hide();

    loadMyNFTs(); // ✅ 변경된 가격 반영
  } catch (error) {
    console.error("❌ NFT 가격 변경 오류:", error);
    alert("NFT 가격 변경 실패!");
  }
}

