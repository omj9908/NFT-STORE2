let App = {
  // Web3 객체 변수.
  web3: null,

  // 배포된 계약의 ABI.
  contractABI: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "subtractedValue",
          type: "uint256",
        },
      ],
      name: "decreaseAllowance",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "addedValue",
          type: "uint256",
        },
      ],
      name: "increaseAllowance",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "myBalance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "refund",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],

  // 배포된 계약의 주소. (Sepolia)
  contractAddress: "0x8EaAefb45ffFf3f96A037c31d71b9d70c007ad1E",

  // 배포된 계약의 주인. (Sepolia)
  ownerAddress: "0xc08979A396dd9A064225105FD1708E4c1CA7B3e8",

  // 계약 객체.
  myContract: null,

  // 계약 호출자 (토큰 요청자)의 주소.
  senderAddress: null,

  // 블록체인에 연결해 주는 함수.
  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      console.log("Web3 불러왔습니다.");
      window.ethereum.request({ method: "eth_requestAccounts" }); // 사이트에 계정이 연결되어 있지 않으면 연결 신청!
      if (window.ethereum.isMetaMask) {
        this.web3 = new Web3(window.ethereum); // MetaMask를 통해서 Web3를 제공 받음.
        console.log("MetaMask 준비됨."); // 모든 준비 완료.
      } else {
        console.log("MetaMask 사용 불가.");
      }
    } else {
      console.log("오류! Web3를 불러 올수 없습니다.");
    }
  },

  // 계약 객체를 생성해 주는 함수.
  initContract: function () {
    this.myContract = new this.web3.eth.Contract(
      this.contractABI,
      this.contractAddress
    );
  },

  // 요청자의 주소 기록 및 출력.
  initSender: async function () {
    this.senderAddress = (await this.web3.eth.getAccounts())[0];
    $("#senderAddr").val(this.senderAddress);
  },

  // 계약의 토큰 잔고 출력.
  showTokenBalance: async function () {
    let ownerBalance = await this.myContract.methods
      .myBalance()
      .call({ from: this.ownerAddress });
    $("#show").text("Faucet의 잔고 : " + ownerBalance / 10 ** 18);
  },

  // 계약의 withdraw() 함수 호출해 주는 함수.
  callWithdraw: async function () {
    if (this.senderAddress != this.ownerAddress) {
      // 계약의 상태 (state)를 바꾸는 경우이기 때문에 send().
      await this.myContract.methods
        .withdraw()
        .send({ from: this.senderAddress });
    } else {
      alert("토큰을 요청하는 주소는 계약 Owner의 주소와 같으면 않됩니다!");
    }
    location.reload(); // 현 페이지 refresh.
  },

  // 계약의 refund() 함수 호출해 주는 함수.
  callRefund: async function () {
    if (this.senderAddress != this.ownerAddress) {
      // 계약의 상태 (state)를 바꾸는 경우이기 때문에 send().
      await this.myContract.methods.refund().send({ from: this.senderAddress });
    } else {
      alert("토큰을 반환하는 주소는 계약 Owner의 주소와 같으면 않됩니다!");
    }
    location.reload(); // 현 페이지 refresh.
  },
}; // App의 끝.

//
// 문서가 ready 하면 실행.
//
$(function () {
  App.initWeb3(); // Web3 초기화.
  if (App.web3) {
    // Web3 객체화 성공인 경우에만 다음 실행.
    App.initContract(); // 계약 객체 생성.
    App.initSender(); // 요청자의 주소 기록 및 출력.
    App.showTokenBalance(); // 토큰 잔고 출력.
    // Get 버튼 클릭 이벤트.
    $("#getButton").on("click", function () {
      App.callWithdraw(); // Withdraw 실행.
    });

    // Refund 버튼 클릭 이벤트.
    $("#refundButton").on("click", function () {
      App.callRefund(); // Refund 실행.
    });

    // MetaMask에서 새로운 주소 선택 이벤트.
    window.ethereum.on("accountsChanged", function () {
      location.reload(); // 현 페이지 refresh.
    });
  }
});
