const hre = require("hardhat");

async function main() {
  // ✅ 스마트 컨트랙트 가져오기
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  
  // ✅ 컨트랙트 배포
  const myNFT = await MyNFT.deploy(); 
  await myNFT.waitForDeployment(); // ✅ 배포가 완료될 때까지 대기

  // ✅ 컨트랙트 주소 가져오기
  const contractAddress = await myNFT.getAddress(); // ✅ 올바른 주소 가져오기

  console.log("✅ MyNFT 컨트랙트 배포 완료!");
  console.log("📜 컨트랙트 주소:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 배포 오류:", error);
    process.exit(1);
  });
