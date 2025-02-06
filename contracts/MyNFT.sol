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

    event NFTMinted(address indexed owner, uint256 tokenId, string nftTokenURI);
    event NFTBurned(address indexed owner, uint256 tokenId);

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
    ) public view returns (string memory, string memory, address) {
        require(_exists(tokenId), "NFT does not exist");
        require(!_burnedTokens[tokenId], "NFT is burned");

        return (tokenURI(tokenId), _tokenNames[tokenId], ownerOf(tokenId));
    }

    // ✅ **NFT 소각 기능**
    function burnNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can burn NFT");

        _burn(tokenId);
        _burnedTokens[tokenId] = true;
        delete _tokenNames[tokenId];

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
