const contractAddress = "0x2DE507FfC038eFc92C50Bc7Cf188fea546DaE64A";
const PINATA_JWT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNTk2Y2MyYS01NDY2LTQyNGItYjRlMC03OTVkMTIzNGI5ODAiLCJlbWFpbCI6Im9tajk5MDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjhmNDJiOGI4ZjE3MDFkOGM2ZGVhIiwic2NvcGVkS2V5U2VjcmV0IjoiNWM3MjE5ZDJmN2U5MzA3MTFlYTA0NjQyNDM3OTBhZTU5MThmZTU4NDY4MGUxNGNmMmI5OWJkZmNiMGI5YTllMCIsImV4cCI6MTc3MDM1MzkwM30.qCRw21knqdTqWg6rTb3_ujnnOyl-Wz0FpOLoV7BN2B0"; // Pinata JWT (환경 변수 사용 권장)
const skinTokenAddress = "0x05424247821e47d243c81D6D58f25004fD0F0BC3";

const contractABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "nftTokenURI", "type": "string" },
      { "internalType": "string", "name": "tokenName", "type": "string" }
    ],
    "name": "mintNFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
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
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "burnNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getOwnedNFTs",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const skinTokenABI = [
  {
    "inputs": [{ "internalType": "address", "name": "to", "type": "address" },
               { "internalType": "uint256", "name": "amount", "type": "uint256" },
               { "internalType": "uint256", "name": "skinType", "type": "uint256" }],
    "name": "mintSkins",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let web3;
let nftContract;
let skinContract;
let currentAccount = null;

async function connectWallet() {
  if (!window.ethereum) {
    alert("❌ MetaMask가 설치되지 않았습니다.");
    return null;
  }

  try {
    console.log("📌 MetaMask 로그인 요청...");
    web3 = new Web3(window.ethereum);

    // ✅ 항상 계정 선택 창을 띄움
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    if (!accounts || accounts.length === 0) {
      alert("❌ MetaMask 계정이 연결되지 않았습니다.");
      return null;
    }

    currentAccount = accounts[0];

    nftContract = new web3.eth.Contract(contractABI, contractAddress);
    skinContract = new web3.eth.Contract(skinTokenABI, skinTokenAddress);
    
    console.log(`✅ MetaMask 연결 완료! 선택된 계정: ${currentAccount}`);

    return currentAccount;
  } catch (error) {
    console.error("❌ MetaMask 연결 오류:", error);
    return null;
  }
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", async function (newAccounts) {
    if (!newAccounts || newAccounts.length === 0) {
      alert("❌ MetaMask에서 로그아웃되었습니다.");
      return;
    }

    console.log("🔄 MetaMask 계정 변경 감지:", newAccounts[0]);
    currentAccount = newAccounts[0];

    // UI 업데이트
    document.getElementById("currentAccount").innerText = `현재 계정: ${currentAccount}`;
  });
}

async function uploadToIPFSWithMetadata(file, name, description) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("📌 [Debug] IPFS 이미지 업로드 시작...");

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { "Authorization": PINATA_JWT },
      body: formData
    });

    console.log("✅ [Debug] IPFS 응답 수신 완료!");

    const data = await response.json();
    console.log("📌 [Debug] IPFS 응답 데이터:", data);

    if (!data || !data.IpfsHash) {
      throw new Error("❌ IPFS 업로드 실패: 응답에서 IpfsHash가 없음");
    }

    const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    const metadata = {
      name: name || "NFT 이름",
      description: description || "NFT 설명",
      image: imageUrl
    };

    console.log("📌 [Debug] 생성된 메타데이터:", metadata);

    const metadataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Authorization": PINATA_JWT,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(metadata)
    });

    const metadataData = await metadataResponse.json();
    console.log("📌 [Debug] 메타데이터 IPFS 응답 데이터:", metadataData);

    if (!metadataData || !metadataData.IpfsHash) {
      throw new Error("❌ 메타데이터 IPFS 업로드 실패: 응답에서 IpfsHash가 없음");
    }

    return `https://gateway.pinata.cloud/ipfs/${metadataData.IpfsHash}`;
  } catch (error) {
    console.error("❌ [Debug] IPFS 업로드 오류:", error);
    alert("IPFS 업로드 실패! 콘솔 로그를 확인하세요.");
    return null;
  }
}

async function mintNFT() {
  console.log("✅ [Debug] mintNFT() 함수 실행됨!");

  // ✅ 현재 계정이 없다면 MetaMask 연결 요청
  if (!currentAccount) await connectWallet();

  const recipientAddress = document.getElementById("recipientAddress").value.trim();
  const nftName = document.getElementById("nftName").value.trim(); // ✅ NFT 이름 가져오기
  const description = document.getElementById("description").value.trim(); // ✅ NFT 설명 가져오기
  const fileInput = document.getElementById("upload");

  console.log("📌 [Debug] 수신자 주소:", recipientAddress);
  console.log("📌 [Debug] NFT 이름:", nftName);
  console.log("📌 [Debug] NFT 설명:", description);

  // ✅ 사용자가 입력한 지갑 주소 유효성 검사
  if (!web3.utils.isAddress(recipientAddress)) {
    alert("⚠️ 유효하지 않은 지갑 주소입니다.");
    console.log("❌ [Debug] 유효하지 않은 지갑 주소");
    return;
  }

  if (!fileInput || fileInput.files.length === 0) {
    alert("⚠️ NFT로 등록할 이미지를 업로드하세요.");
    console.log("❌ [Debug] 이미지 파일이 선택되지 않음");
    return;
  }

  document.getElementById("status").innerText = "⏳ NFT 이미지 및 메타데이터 업로드 중...";
  console.log("📌 [Debug] IPFS에 NFT 이미지 업로드 시작...");

  const metadataURI = await uploadToIPFSWithMetadata(fileInput.files[0], nftName, description);

  if (!metadataURI) {
    console.log("❌ [Debug] IPFS 업로드 실패");
    document.getElementById("status").innerText = "❌ NFT 발행 실패 (IPFS 업로드 오류)";
    return;
  }

  console.log("📌 [Debug] 생성된 NFT 메타데이터 URI:", metadataURI);
  document.getElementById("status").innerText = "⏳ NFT 발행 중...";

  try {
    // ✅ NFT 민팅 실행
    const tx = await nftContract.methods.mintNFT(recipientAddress, metadataURI, nftName).send({
      from: currentAccount,
      gas: 300000
    });

    console.log("✅ [Debug] NFT 발행 성공! 트랜잭션:", tx);
    document.getElementById("status").innerText = `✅ NFT 발행 성공! Tx: ${tx.transactionHash}`;
    alert(`✅ NFT 민팅 성공! 트랜잭션: ${tx.transactionHash}`);
  } catch (error) {
    console.error("❌ [Debug] NFT 발행 오류:", error);
    document.getElementById("status").innerText = "❌ NFT 발행 실패!";
    alert("❌ NFT 민팅 실패!");
  }
}

async function buySkin(skinType, amount) {
  if (!currentAccount) await connectWallet();

  try {
      console.log(`🔵 스킨 구매 요청: 계정=${currentAccount}, 스킨 타입=${skinType}, 개수=${amount}`);

      const tx = await skinContract.methods.mintSkins(currentAccount, amount, skinType).send({
          from: currentAccount,
          gas: 300000,  // 가스 제한 추가
          gasPrice: await web3.eth.getGasPrice() // 가스 가격 자동 설정
      });

      console.log("✅ 트랜잭션 성공:", tx);
      alert(`✅ ${amount}개의 ${skinType === 1 ? "Red Dice" : "Blue Dice"} 구매 성공!`);
  } catch (error) {
      console.error("❌ 스킨 구매 오류:", error);
      alert("❌ 스킨 구매 실패!");
  }
}

async function upgradeSkinToNFT(metadataURI) {
  const contract = new web3.eth.Contract(gameManagerABI, gameManagerAddress);
  await contract.methods.upgradeToSpecialSkin(metadataURI).send({ from: currentAccount });
  alert("✅ NFT로 업그레이드 성공!");
}

async function getMySkinBalance() {
  if (!currentAccount) await connectWallet();

  try {
      // 🔴 Red Dice 개수 조회
      const redDiceBalance = await skinContract.methods.balanceOf(currentAccount).call();
      
      console.log(`🎲 내 스킨 보유량 (ERC-20) - 🔴 Red Dice: ${redDiceBalance}`);

      // ✅ UI 업데이트 (HTML에 표시)
      document.getElementById("redDiceBalance").innerText = `🔴 Red Dice 보유량: ${redDiceBalance}`;
  } catch (error) {
      console.error("❌ 스킨(ERC-20) 보유량 조회 오류:", error);
      alert("❌ 스킨 보유량을 불러오는 데 실패했습니다.");
  }
}


document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ [Debug] 문서 로드 완료!");

  // ✅ 업로드 버튼 클릭 이벤트 추가
  const uploadButton = document.getElementById("uploadButton");
  if (uploadButton) {
      uploadButton.addEventListener("click", async () => {
          console.log("✅ [Debug] 업로드 버튼 클릭됨!");

          const fileInput = document.getElementById("upload");
          if (!fileInput || fileInput.files.length === 0) {
              alert("⚠️ 파일을 선택하세요.");
              console.log("❌ [Debug] 파일이 선택되지 않음.");
              return;
          }

          console.log("📌 [Debug] 업로드할 파일:", fileInput.files[0]);

          const name = document.getElementById("nftName").value.trim();
          const description = document.getElementById("description").value.trim();

          document.getElementById("result").innerText = "이미지 및 메타데이터 업로드 중...";

          const metadataURI = await uploadToIPFSWithMetadata(fileInput.files[0], name, description);

          if (metadataURI) {
              console.log("✅ [Debug] 업로드 완료! 메타데이터 URI:", metadataURI);
              document.getElementById("result").innerText = `✅ 업로드 완료! IPFS 링크: ${metadataURI}`;
          } else {
              console.log("❌ [Debug] 업로드 실패!");
              document.getElementById("result").innerText = "❌ 업로드 실패!";
          }
      });
  } else {
      console.warn("⚠️ [Debug] 업로드 버튼을 찾을 수 없음!");
  }

  // ✅ NFT 민팅 버튼 클릭 이벤트 추가
  const mintButton = document.getElementById("mintButton");
  if (mintButton) {
      mintButton.addEventListener("click", async () => {
          console.log("✅ NFT 민팅 버튼 클릭됨!");
          await mintNFT();
      });
  } else {
      console.warn("⚠️ [Debug] NFT 민팅 버튼을 찾을 수 없음!");
  }

  // ✅ 일반적인 스킨(ERC-20) 구매 버튼 클릭 이벤트 추가
  const buyRedDiceButton = document.getElementById("buyRedDice");
  if (buyRedDiceButton) {
      buyRedDiceButton.addEventListener("click", async () => {
          console.log("✅ Red Dice 구매 버튼 클릭됨!");
          await buySkin(1, 1); // 🔴 Red Dice 구매 (1개)
      });
  } else {
      console.warn("⚠️ [Debug] Red Dice 구매 버튼을 찾을 수 없음!");
  }

  const buyBlueDiceButton = document.getElementById("buyBlueDice");
  if (buyBlueDiceButton) {
      buyBlueDiceButton.addEventListener("click", async () => {
          console.log("✅ Blue Dice 구매 버튼 클릭됨!");
          await buySkin(2, 1); // 🔵 Blue Dice 구매 (1개)
      });
  } else {
      console.warn("⚠️ [Debug] Blue Dice 구매 버튼을 찾을 수 없음!");
  }
});
