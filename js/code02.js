let App = {
  // Web3 객체 변수.
  web3: null,

  // 배포된 계약의 ABI.
  contractABI: [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_id",
          type: "uint256",
        },
        {
          internalType: "string",
          name: "_name",
          type: "string",
        },
        {
          internalType: "string",
          name: "_contact",
          type: "string",
        },
      ],
      name: "adoptPet",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "deleteAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_adopterAddress",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_id",
          type: "uint256",
        },
      ],
      name: "PetAdopted",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "adopterInfo",
      outputs: [
        {
          internalType: "address",
          name: "addr",
          type: "address",
        },
        {
          internalType: "string",
          name: "name",
          type: "string",
        },
        {
          internalType: "string",
          name: "contact",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "adopters",
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
      inputs: [
        {
          internalType: "uint256",
          name: "_id",
          type: "uint256",
        },
      ],
      name: "getAdopterInfo",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "string",
          name: "",
          type: "string",
        },
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
      name: "getAllAdopters",
      outputs: [
        {
          internalType: "address[100]",
          name: "",
          type: "address[100]",
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
          internalType: "address payable",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],

  // 배포된 계약의 주소. (Ganache)
  contractAddress: "0x555D8cF637D324e85F36FC4AC3e45d1cEc38b4Dc",

  // 배포된 계약의 주인. (Ganache)
  ownerAddress: "0x356F390D4dFE9CB9bCD09e86a1D1655197992a11",

  // 계약 객체.
  myContract: null,

  // 계약 호출자의 주소.
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

  // 요청자의 주소를 기록해 주는 함수.
  initSender: async function () {
    this.senderAddress = (await this.web3.eth.getAccounts())[0];
  },

  // 개개 입양자의 세부 정보를 가져다 주는 함수.
  callGetAdopterInfo: async function (e) {
    let id = $(e.relatedTarget).parent().find("#myID").find("span").text(); // 모달을 호출한 카드의 ID 값!
    let info = await this.myContract.methods.getAdopterInfo(id).call();
    info = Object.values(info);
    $(e.currentTarget).find("#addrAdopterInfo").val(info[0]); // 입양자 주소.
    $(e.currentTarget).find("#nameAdopterInfo").val(info[1]); // 입양자 이름.
    $(e.currentTarget).find("#contactAdopterInfo").val(info[2]); // 입양자 연락처.
  },

  // 입양을 기록해 주는 함수.
  callAdoptPet: async function () {
    if (this.senderAddress != this.ownerAddress) {
      let sent = submitModalAdopt();
      // 다음 행 실행을 위해서는 충분한 gas비를 책정해야 한다!
      await this.myContract.methods
        .adoptPet(sent.id, sent.name, sent.contact)
        .send({ from: this.senderAddress, gas: 300000, value: sent.cost });
      // 현 페이지 refresh.
      location.reload();
    } else {
      alert("입양자의 주소는 계약 Owner의 주소와 같으면 않됩니다!");
    }
  },

  // 카드들을 refresh 해주는 함수.
  refreshCards: async function () {
    let addrs = await this.myContract.methods.getAllAdopters().call();
    if (addrs) {
      for (let i = 0; i < addrs.length; i++) {
        if (addrs[i] != "0x0000000000000000000000000000000000000000") {
          $(".card").eq(i).find("img").addClass("img_bw"); // 흑백 처리.
          $(".card").eq(i).find(".adopt").css({ display: "none" }); // 입양 버튼 숨기기.
          $(".card").eq(i).find(".info").css({ display: "inline" });
        }
      }
    }
  },
}; // App의 끝.

// 애완동물 정보를 JSON 파일에서 불러온다.
$.getJSON("./js/pet-animals.json", function (data) {
  // 애완동물 정보를 불러온 이후 콜백함수 실행.
  let cardTemplate = $("#cardTemplate"); // 카드 템플레이트 가져오기.
  data.forEach((x) => {
    cardTemplate.find("img").attr("src", x.src);
    cardTemplate.find("#myTitle").text(x.title);
    cardTemplate.find("#myID").find("span").text(x.id);
    cardTemplate.find("#myBreed").find("span").text(x.breed);
    cardTemplate.find("#myAge").find("span").text(x.age);
    cardTemplate.find("#myCost").find("span").text(x.cost);
    $(".row").append(cardTemplate.html()); // 준비된 카드 템플레이트 삽입!
  });
});

// Adopt 모달창이 보여지는 이벤트 핸들링 함수 부착!
$("#myModalAdopt").on("shown.bs.modal", (e) => {
  let id = $(e.relatedTarget).parent().find("#myID").find("span").text(); // 모달을 호출한 카드의 ID 값!
  let cost = $(e.relatedTarget).parent().find("#myCost").find("span").text(); // 모달을 호출한 카드의 ID 값!
  $(e.currentTarget).find("#myIDAdoptee").val(id); // 가져온 ID를 모달창의 숨겨진 값으로 저장.
  $(e.currentTarget).find("#myCostAdoptee").val(cost); // 가져온 Cost를 모달창의 숨겨진 값으로 저장.
  $(e.currentTarget).find("#nameAdopter").val(""); // 입양자 이름 초기화.
  $(e.currentTarget).find("#contactAdopter").val(""); // 연락처 초기화.
});

// 보조함수.
function submitModalAdopt() {
  let rate = 10 ** 18; // ETH => Wei 변환률.
  let id = $("#myModalAdopt").find("#myIDAdoptee").val(); // 모달창이 품고 있던 ID.
  let cost = parseFloat($("#myModalAdopt").find("#myCostAdoptee").val()) * rate; // 모달창이 품고 있던 Cost.
  let name = $("#myModalAdopt").find("#nameAdopter").val(); // 모달창으로 입력된 입양자 데이터.
  let contact = $("#myModalAdopt").find("#contactAdopter").val(); // 모달창으로 입력된 연락처 (contact) 데이터.
  $("#myModalAdopt").find("#myIDAdoptee").val(0); // 리셋!
  $("#myModalAdopt").find("#myCostAdoptee").val(0); // 리셋!
  $("#myModalAdopt").find("#nameAdopter").val(""); // 리셋!
  $("#myModalAdopt").find("#contactAdopter").val(""); // 리셋!
  $("#myModalAdopt").modal("hide"); // 모달창을 숨기다.
  console.log(
    `ID = ${id}는 ${name}에게 ${cost} Wei 비용으로 입양되었습니다! 연락처는 ${contact}입니다.`
  );
  return { id: id, cost: cost, name: name, contact: contact };
}

//
// 문서가 ready 하면 실행.
//
$(function () {
  // 다음으로는 Web3 초기화.
  App.initWeb3(); // Web3 초기화.
  if (App.web3) {
    // Web3 객체화 성공인 경우에만 다음 실행.
    App.initContract(); // 계약 객체 생성.
    App.initSender(); // 요청자의 주소 기록 및 출력.
    App.refreshCards(); // 지금 까지의 모든 입양자 정보를 바탕으로 카드들을 refresh.

    // confirmAdopt 버튼 클릭 이벤트.
    $("#confirmAdopt").on("click", function () {
      App.callAdoptPet();
    });

    // myModalInfo 모달이 보여지는 이벤트.
    $("#myModalInfo").on("shown.bs.modal", async function (e) {
      App.callGetAdopterInfo(e);
    });

    // MetaMask에서 새로운 주소 선택 이벤트.
    window.ethereum.on("accountsChanged", function () {
      location.reload(); // 현 페이지 refresh.
    });
  }
});
