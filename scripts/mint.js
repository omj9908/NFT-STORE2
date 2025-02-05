const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x8c3Fb1d4C4C05D2E25Ed9495C3248fc104b7Ce11"; // ✅ 배포된 컨트랙트 주소
  const recipientAddress = "0x4c9ae637e9995DBb99Dd6C8d04E977e469bC67bA";
  const tokenURI = "https://ipfs.io/ipfs/QmYourTokenURI";

  const myNFT = await ethers.getContractAt("MyNFT", contractAddress);

  console.log(`🚀 NFT 발행 시작: ${recipientAddress}`);
  const tx = await myNFT.mintNFT(recipientAddress, tokenURI, {
    gasLimit: 500000,
    gasPrice: ethers.parseUnits("20", "gwei"),
  });

  console.log("✅ 트랜잭션 성공:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
