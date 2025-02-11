const contractAddress = "0xD85944D670c1d3fA86650862982D27e976EeD02B"; 
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

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask를 설치하세요!");
    return null;
  }
  web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: "eth_requestAccounts" });
  contract = new web3.eth.Contract(contractABI, contractAddress);
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
  await connectWallet();
  const accounts = await web3.eth.getAccounts();
  const nftContainer = document.getElementById("nftContainer");
  nftContainer.innerHTML = "";
  document.getElementById("status").innerText = "NFT 불러오는 중...";

  try {
      // ✅ 올바르게 사용자의 주소를 매개변수로 전달하여 호출!
      let nftList = await contract.methods.getOwnedNFTs(accounts[0]).call();

      console.log(`🛍️ 내 NFT 목록:`, nftList); // ✅ 디버깅 로그 추가

      if (!Array.isArray(nftList)) {
          console.error("❌ Web3.js가 예상한 배열 형식이 아닙니다:", nftList);
          nftList = []; // 강제로 빈 배열 설정
      }

      if (nftList.length === 0) {
          document.getElementById("status").innerText = "소유한 NFT가 없습니다.";
          return;
      }

      document.getElementById("status").innerText = "";

      for (let tokenId of nftList) {
          try {
              const nft = await contract.methods.getNFTInfo(tokenId).call();
              console.log(`📌 NFT ${tokenId} 정보:`, nft);

              let metadata = { 
                  imageUrl: "https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image", 
                  description: "설명이 없습니다." 
              };

              if (nft.tokenURI) {
                  console.log(`🌍 Original tokenURI: ${nft.tokenURI}`);

                  if (nft.tokenURI.startsWith("ipfs://") || nft.tokenURI.endsWith(".json") || nft.tokenURI.includes("pinata")) {
                      metadata = await fetchImageFromMetadata(nft.tokenURI);
                  } else {
                      metadata.imageUrl = nft.tokenURI;
                  }
              }

              const priceInEther = nft.price ? web3.utils.fromWei(nft.price, "ether") : "판매되지 않음";

              const nftElement = document.createElement("div");
              nftElement.classList.add("col-md-4", "mb-4");

              nftElement.innerHTML = `
                  <div class="card shadow-sm">
                      <img src="${metadata.imageUrl}" class="card-img-top" 
                          onerror="this.onerror=null;this.src='https://dummyimage.com/250x250/cccccc/000000.png&text=No+Image'">
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
              console.error(`❌ NFT 정보 조회 오류:`, error);
          }
      }
  } catch (error) {
      console.error("❌ 소유한 NFT 조회 오류:", error);
      document.getElementById("status").innerText = "NFT 조회 오류 발생!";
  }
}



document.addEventListener("DOMContentLoaded", function () {
  const withdrawButton = document.getElementById("withdrawButton");

  if (withdrawButton) {
      withdrawButton.addEventListener("click", async function () {
          await connectWallet();
          const accounts = await web3.eth.getAccounts();

          try {
              const owner = await contract.methods.owner().call();
              if (accounts[0].toLowerCase() !== owner.toLowerCase()) {
                  alert("출금 실패! 컨트랙트 소유자만 가능합니다.");
                  return;
              }

              let amountToWithdraw = prompt("출금할 금액을 ETH 단위로 입력하세요:", "1");
              if (!amountToWithdraw || isNaN(amountToWithdraw) || parseFloat(amountToWithdraw) <= 0) {
                  alert("올바른 출금 금액을 입력하세요!");
                  return;
              }

              const withdrawAmount = web3.utils.toWei(amountToWithdraw, "ether");

              await contract.methods.withdrawFunds(withdrawAmount).send({
                  from: accounts[0],
                  gas: 300000,
                  gasPrice: await web3.eth.getGasPrice()
              });

              alert(`✅ ${amountToWithdraw} ETH가 컨트랙트에서 출금되었습니다.`);
          } catch (error) {
              console.error("❌ 출금 오류:", error);
              alert("출금 실패! 컨트랙트에 잔액이 있는지 확인하세요.");
          }
      });
  }
});


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


