const contractAddress = "0xF16BE0490925535a005Ea8B4F5DD089CE70D9D61"; // ✅ 최신 컨트랙트 주소
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNTk2Y2MyYS01NDY2LTQyNGItYjRlMC03OTVkMTIzNGI5ODAiLCJlbWFpbCI6Im9tajk5MDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjNkNTMyYjllNzhmZGNmYmE3YjA0Iiwic2NvcGVkS2V5U2VjcmV0IjoiODNmYzk0N2FkMTExMWQyY2NiZWIwZTU2MDg4OTk1MzJhYTBjZmFmZDVhNzU2OGM4MGQyNWY1NDU2Y2Y4MjdjNyIsImV4cCI6MTc3MDI1ODI3M30.8EyTMFe_sAIw9SoG1irjTki6zzNkCOcXy7TqmRlkFgU"; // ✅ 환경 변수에서 JWT 가져오기

const contractABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintNFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
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

  contract = new web3.eth.Contract(contractABI, contractAddress); // ✅ 전역 contract 객체 설정
  return web3;
}

// ✅ **IPFS 업로드**
async function uploadToIPFS(file) {
  const formData = new FormData();
  formData.append("file", file);
  console.log("📌 선택한 파일:", file);

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    const data = await response.json();
    console.log("📌 IPFS 업로드 응답:", data);

    if (!data || !data.IpfsHash) {
      throw new Error("IPFS 업로드 실패: 응답에서 IpfsHash가 없음");
    }

    return `https://black-peaceful-unicorn-811.mypinata.cloud/ipfs/${data.IpfsHash}`;
  } catch (error) {
    console.error("❌ IPFS 업로드 오류:", error);
    alert("IPFS 업로드 실패! 콘솔에서 오류 로그를 확인하세요.");
    return null;
  }
}

// ✅ **NFT 민팅**
async function mintNFT() {
  const web3 = await connectWallet();
  if (!web3) return;

  const accounts = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(contractABI, contractAddress);

  const recipientAddress = document.getElementById("recipientAddress").value.trim();
  if (!web3.utils.isAddress(recipientAddress)) {
    alert("유효하지 않은 지갑 주소입니다.");
    return;
  }

  const fileInput = document.getElementById("upload");
  if (fileInput.files.length === 0) {
    alert("NFT로 등록할 이미지를 업로드하세요.");
    return;
  }

  const imageFile = fileInput.files[0];
  const tokenURI = await uploadToIPFS(imageFile);
  if (!tokenURI) return;

  document.getElementById("status").innerText = "NFT 발행 중...";

  try {
    const tx = await contract.methods.mintNFT(recipientAddress, tokenURI)
      .send({
        from: accounts[0],
        gasLimit: 500000,
        gasPrice: web3.utils.toWei("20", "gwei"),
      });

    console.log("✅ NFT 발행 트랜잭션:", tx);

    // ✅ 트랜잭션 이벤트 확인
    let tokenId = null;
    if (tx.events && tx.events.Transfer) {
      tokenId = tx.events.Transfer.returnValues.tokenId;
    } else {
      console.warn("⚠️ tokenId를 가져올 수 없음. 수동 조회 시도...");
      tokenId = await getLastTokenId();
    }

    console.log(`🔹 발행된 NFT ID: ${tokenId}`);

    // ✅ 소유자 확인
    if (tokenId !== null) {
      const owner = await contract.methods.ownerOf(tokenId).call();
      console.log(`✅ NFT ${tokenId}의 최종 소유자: `, owner);
    } else {
      console.warn("❌ NFT 발행 후 tokenId를 찾을 수 없음.");
    }

    document.getElementById("status").innerText = `NFT 발행 성공! Tx: ${tx.transactionHash}`;
  } catch (error) {
    console.error("❌ NFT 발행 오류:", error);
    document.getElementById("status").innerText = "NFT 발행 실패!";
  }
}

// ✅ **최신 NFT ID 조회**
async function getLastTokenId() {
  try {
    if (!contract || !contract.methods) {
      console.error("❌ contract 객체가 정의되지 않음.");
      return null;
    }

    if (contract.methods.totalSupply) {
      const totalSupply = await contract.methods.totalSupply().call();
      return totalSupply > 0 ? totalSupply - 1 : 0;
    } else {
      console.warn("⚠️ totalSupply() 메서드 없음. 수동으로 마지막 토큰 ID 추정.");
      
      let lastTokenId = 0;
      while (true) {
        try {
          await contract.methods.ownerOf(lastTokenId).call();
          lastTokenId++;
        } catch (error) {
          break;
        }
      }
      return lastTokenId - 1; // 마지막 유효한 토큰 ID 반환
    }
  } catch (error) {
    console.error("❌ 최신 NFT ID 조회 실패:", error);
    return null;
  }
}

// ✅ **HTML 이벤트 리스너 등록**
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mintButton").addEventListener("click", mintNFT);
  
  document.getElementById("uploadButton").addEventListener("click", async () => {
    const fileInput = document.getElementById("upload");
    if (fileInput.files.length === 0) {
      alert("이미지를 선택하세요.");
      return;
    }

    document.getElementById("result").innerText = "이미지 업로드 중...";
    const file = fileInput.files[0];

    console.log("📌 업로드할 파일:", file);
    const tokenURI = await uploadToIPFS(file);

    if (tokenURI) {
      document.getElementById("result").innerText = `업로드 완료! IPFS 링크: ${tokenURI}`;
    }
  });
});
