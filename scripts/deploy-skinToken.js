const hre = require("hardhat");

async function main() {
  // ✅ ERC-20 SkinToken 컨트랙트 가져오기
  const SkinToken = await hre.ethers.getContractFactory("SkinToken");

  // ✅ 컨트랙트 배포
  const skinToken = await SkinToken.deploy();
  await skinToken.waitForDeployment();
  const skinTokenAddress = await skinToken.getAddress(); // ✅ ERC-20 컨트랙트 주소 가져오기

  console.log("✅ SkinToken 컨트랙트 배포 완료!");
  console.log("📜 SkinToken 컨트랙트 주소:", skinTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 배포 오류:", error);
    process.exit(1);
  });
