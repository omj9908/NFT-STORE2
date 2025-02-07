// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721URIStorage, ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(uint256 => string) private _tokenNames;
    mapping(uint256 => bool) private _burnedTokens;
    mapping(uint256 => uint256) public nftPrices; // NFT 판매 가격 저장

    event NFTMinted(address indexed owner, uint256 tokenId, string nftTokenURI);
    event NFTBurned(address indexed owner, uint256 tokenId);
    event NFTListedForSale(uint256 tokenId, uint256 price);
    event NFTPurchased(uint256 tokenId, address buyer);
    event NFTPriceUpdated(uint256 tokenId, uint256 newPrice);
    event NFTNameUpdated(uint256 tokenId, string newName);

    constructor() ERC721("MyNFT", "MNFT") {}

    // ✅ **NFT 민팅 함수**
    function mintNFT(
        address to,
        string memory nftTokenURI,
        string memory tokenName
    ) public returns (uint256) {
        require(to != address(0), "Invalid recipient address: Zero Address");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, nftTokenURI);
        _tokenNames[newTokenId] = bytes(tokenName).length > 0
            ? tokenName
            : "Unnamed NFT";

        emit NFTMinted(to, newTokenId, nftTokenURI);
        return newTokenId;
    }

    // ✅ **NFT 정보 조회 함수**
    function getNFTInfo(
        uint256 tokenId
    ) public view returns (string memory, string memory, address, uint256) {
        require(_exists(tokenId), "NFT does not exist");
        require(!_burnedTokens[tokenId], "NFT is burned");

        return (
            tokenURI(tokenId),
            _tokenNames[tokenId],
            ownerOf(tokenId),
            nftPrices[tokenId]
        );
    }

    // ✅ **NFT 이름 변경 기능 (소유권 검증 개선)**
    function setNFTName(uint256 tokenId, string memory newName) public {
        require(_exists(tokenId), "NFT does not exist");
        require(
            ownerOf(tokenId) == msg.sender,
            "Only owner can change NFT name"
        );
        require(!_burnedTokens[tokenId], "NFT is burned");

        _tokenNames[tokenId] = newName;
        emit NFTNameUpdated(tokenId, newName);
    }

    // ✅ **NFT 소각 기능**
    function burnNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can burn NFT");

        _burn(tokenId);
        _burnedTokens[tokenId] = true;
        delete _tokenNames[tokenId];
        delete nftPrices[tokenId]; // 판매 목록에서 삭제

        emit NFTBurned(msg.sender, tokenId);
    }

    // ✅ **소유한 NFT 목록 반환 (`ERC721Enumerable` 활용)**
    function getOwnedNFTs(
        address owner
    ) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ownedNFTs = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            ownedNFTs[i] = tokenOfOwnerByIndex(owner, i);
        }
        return ownedNFTs;
    }

    // ✅ **NFT 판매 등록 기능**
    function listNFTForSale(uint256 tokenId, uint256 price) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only owner can list NFT for sale"
        );
        require(!_burnedTokens[tokenId], "NFT is burned");
        require(price > 0, "Price must be greater than 0");

        nftPrices[tokenId] = price;
        emit NFTListedForSale(tokenId, price);
    }

    // ✅ **NFT 가격 변경 기능 추가**
    function updateNFTPrice(uint256 tokenId, uint256 newPrice) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only owner can change the price"
        );
        require(!_burnedTokens[tokenId], "NFT is burned");
        require(newPrice > 0, "Price must be greater than 0");

        nftPrices[tokenId] = newPrice;
        emit NFTPriceUpdated(tokenId, newPrice);
    }

    // ✅ **NFT 구매 기능**
    function buyNFT(uint256 tokenId) public payable {
        require(nftPrices[tokenId] > 0, "NFT is not for sale");
        require(msg.value >= nftPrices[tokenId], "Insufficient payment");

        address seller = ownerOf(tokenId);
        _transfer(seller, msg.sender, tokenId);

        // 판매 대금 전송
        payable(seller).transfer(msg.value);
        nftPrices[tokenId] = 0; // 판매 완료 후 가격 삭제

        emit NFTPurchased(tokenId, msg.sender);
    }

    // ✅ **오버라이딩 충돌 해결**
    function _burn(
        uint256 tokenId
    ) internal override(ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721URIStorage, ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable, ERC721) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
