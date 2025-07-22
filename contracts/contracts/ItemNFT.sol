// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItemNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // Mapping from token ID to item metadata
    mapping(uint256 => ItemMetadata) public itemMetadata;
    
    struct ItemMetadata {
        string itemId;      // UUID from backend
        string title;
        string description;
        string model;
        string certificate;
        string images;      // Comma-separated image URLs
        address creator;
        uint256 createdAt;
    }

    event ItemNFTMinted(
        uint256 indexed tokenId,
        string indexed itemId,
        address indexed creator,
        string title
    );

    constructor() ERC721("Urban Barnacle Item", "UBI") Ownable(msg.sender) {}

    function mintItemNFT(
        address to,
        string memory itemId,
        string memory title,
        string memory description,
        string memory model,
        string memory certificate,
        string memory images,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        itemMetadata[tokenId] = ItemMetadata({
            itemId: itemId,
            title: title,
            description: description,
            model: model,
            certificate: certificate,
            images: images,
            creator: to,
            createdAt: block.timestamp
        });

        emit ItemNFTMinted(tokenId, itemId, to, title);
        
        return tokenId;
    }

    function getItemMetadata(uint256 tokenId) public view returns (ItemMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return itemMetadata[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721) {
        super._increaseBalance(account, value);
    }
}
