// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SkinToken is ERC20, Ownable {
    mapping(uint256 => string) public skinNames; // 각 스킨의 이름 (예: 1 -> "Red Dice")

    constructor() ERC20("SkinToken", "SKIN") {
        _mint(msg.sender, 10000 * 10 ** decimals()); // 초기 공급량 10,000개
    }

    function mintSkins(address to, uint256 amount, uint256 skinType) public {
        // ✅ 모든 유저 실행 가능
        require(skinType > 0, "Invalid skin type");
        _mint(to, amount);
    }

    function burnSkins(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function getMySkins(address user) public view returns (uint256) {
        return balanceOf(user);
    }
}
