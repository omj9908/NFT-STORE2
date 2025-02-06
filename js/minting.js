const contractAddress = "0x9fCf9c341cAD3De0953fAeCb83162B2d431D2DaD"; // 최신 컨트랙트 주소
const PINATA_JWT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNTk2Y2MyYS01NDY2LTQyNGItYjRlMC03OTVkMTIzNGI5ODAiLCJlbWFpbCI6Im9tajk5MDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjhmNDJiOGI4ZjE3MDFkOGM2ZGVhIiwic2NvcGVkS2V5U2VjcmV0IjoiNWM3MjE5ZDJmN2U5MzA3MTFlYTA0NjQyNDM3OTBhZTU5MThmZTU4NDY4MGUxNGNmMmI5OWJkZmNiMGI5YTllMCIsImV4cCI6MTc3MDM1MzkwM30.qCRw21knqdTqWg6rTb3_ujnnOyl-Wz0FpOLoV7BN2B0"; // Pinata JWT (환경 변수 사용 권장)

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

let web3;
let contract;

// ✅ **MetaMask 연결**
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask를 설치하세요!");
    console.error("❌ [Debug] MetaMask가 설치되지 않음.");
    return null;
  }

  try {
    console.log("📌 [Debug] MetaMask 연결 시도...");
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });

    contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log("✅ [Debug] MetaMask 연결 완료!");
    return web3;
  } catch (error) {
    console.error("❌ [Debug] MetaMask 연결 오류:", error);
    return null;
  }
}

// ✅ **IPFS 업로드 (이미지 & 메타데이터)**
async function uploadToIPFSWithMetadata(file, name, description) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("📌 [Debug] IPFS 이미지 업로드 시작...");

    // 1️⃣ 이미지 업로드
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

    // 2️⃣ 메타데이터 JSON 생성
    const metadata = {
      name: name || "NFT 이름",
      description: description || "NFT 설명",
      image: imageUrl
    };

    console.log("📌 [Debug] 생성된 메타데이터:", metadata);

    // 3️⃣ 메타데이터 IPFS 업로드
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

// ✅ **파일 업로드 버튼 클릭 이벤트**
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("uploadButton").addEventListener("click", async () => {
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
        
        // ✅ IPFS 업로드 시작
        const metadataURI = await uploadToIPFSWithMetadata(fileInput.files[0], name, description);
        
        if (metadataURI) {
            console.log("✅ [Debug] 업로드 완료! 메타데이터 URI:", metadataURI);
            document.getElementById("result").innerText = `✅ 업로드 완료! IPFS 링크: ${metadataURI}`;
        } else {
            console.log("❌ [Debug] 업로드 실패!");
            document.getElementById("result").innerText = "❌ 업로드 실패!";
        }
    });

    document.getElementById("mintButton").addEventListener("click", async () => {
        console.log("✅ [Debug] NFT 민팅 버튼 클릭됨!");
        await mintNFT();
    });
});

// ✅ **NFT 민팅 함수**
async function mintNFT() {
  console.log("✅ [Debug] mintNFT() 함수 실행됨!");

  const web3 = await connectWallet();
  if (!web3) {
    console.log("❌ [Debug] MetaMask 연결 실패");
    return;
  }

  const accounts = await web3.eth.getAccounts();
  console.log("📌 [Debug] 연결된 계정:", accounts[0]);

  const contract = new web3.eth.Contract(contractABI, contractAddress);
  console.log("📌 [Debug] 컨트랙트 인스턴스 생성 완료");

  let recipientAddress = document.getElementById("recipientAddress").value.trim();
  console.log("📌 [Debug] 수신자 주소:", recipientAddress);

  if (!web3.utils.isAddress(recipientAddress)) {
    alert("⚠️ 유효하지 않은 지갑 주소입니다.");
    console.log("❌ [Debug] 유효하지 않은 지갑 주소");
    return;
  }

  const fileInput = document.getElementById("upload");
  if (fileInput.files.length === 0) {
    alert("⚠️ NFT로 등록할 이미지를 업로드하세요.");
    console.log("❌ [Debug] 이미지 파일이 선택되지 않음");
    return;
  }

  const name = document.getElementById("nftName").value.trim() || "Default NFT Name";
  const description = document.getElementById("description").value.trim();

  // ✅ 메타데이터 업로드 실행
  const metadataURI = await uploadToIPFSWithMetadata(fileInput.files[0], name, description);
  console.log("📌 [Debug] 생성된 NFT 메타데이터 URI:", metadataURI);

  if (!metadataURI) {
    console.log("❌ [Debug] IPFS 업로드 실패");
    return;
  }

  document.getElementById("status").innerText = "⏳ NFT 발행 중...";
  try {
    const tx = await contract.methods.mintNFT(recipientAddress, metadataURI, name)
      .send({
        from: accounts[0],
        gas: 300000,
        gasPrice: web3.utils.toWei("5", "gwei")
      });

    console.log("✅ [Debug] NFT 발행 성공! 트랜잭션:", tx);
    document.getElementById("status").innerText = `✅ NFT 발행 성공! Tx: ${tx.transactionHash}`;
  } catch (error) {
    console.error("❌ [Debug] NFT 발행 오류:", error);
    document.getElementById("status").innerText = "❌ NFT 발행 실패!";
  }
}