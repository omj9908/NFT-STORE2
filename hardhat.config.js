require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // ✅ 환경 변수 로드

console.log("📌 [Debug] GANACHE_PRIVATE_KEY:", process.env.GANACHE_PRIVATE_KEY);
console.log("📌 [Debug] GANACHE_RPC_URL:", process.env.GANACHE_RPC_URL);
console.log("📌 [Debug] GANACHE_CHAIN_ID:", process.env.GANACHE_CHAIN_ID);

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.18" },
      { version: "0.8.20" },
      { version: "0.8.28" }
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    ganache: {
      url: process.env.GANACHE_RPC_URL, // ✅ 환경 변수에서 Ganache URL 불러오기
      chainId: parseInt(process.env.GANACHE_CHAIN_ID), // ✅ 환경 변수에서 Chain ID 불러오기
      accounts: process.env.GANACHE_PRIVATE_KEY ? [`0x${process.env.GANACHE_PRIVATE_KEY}`] : [] // ✅ Ganache Private Key 불러오기
    },
  },
};
