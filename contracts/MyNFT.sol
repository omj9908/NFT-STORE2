// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol"; // ✅ `Counters.sol` 다시 추가

contract MyNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter; // ✅ 안전한 ID 증가 방식 적용
    Counters.Counter private _tokenIds; // ✅ NFT ID 추적

    constructor() ERC721("MyNFT", "MNFT") Ownable() {} // ✅ 배포자가 자동으로 owner 설정됨

    function mintNFT(
        address to,
        string memory tokenURI
    ) public returns (uint256) {
        // ✅ onlyOwner 제거
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        return newTokenId;
    }

    // ✅ 발행된 NFT 개수 반환 (프론트엔드에서 전체 NFT 개수를 확인할 때 유용)
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
