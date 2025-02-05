require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // ✅ 환경 변수 불러오기

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.18" }, // ✅ Solidity 0.8.18 지원
      { version: "0.8.20" }, // ✅ Solidity 0.8.20 지원
      { version: "0.8.28" }  // ✅ Solidity 0.8.28 지원
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [process.env.GANACHE_PRIVATE_KEY]
    },
  },
};
