// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

import "./interfaces.sol";

contract ModelAccessToken is ERC1155, AccessControl, ERC1155Burnable, ERC1155Supply, IModelAccessToken {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    // Holder tracking structures
    mapping(uint256 => address[]) private _taskHolders;                // taskId => array of holders
    mapping(uint256 => mapping(address => uint256)) private _holderIndices;  // taskId => (holder => index+1 in array)
    mapping(uint256 => mapping(address => bool)) private _isHolder;    // taskId => (holder => is current holder)

    // Events
    event ModelAccessUsed(uint256 indexed taskId, address indexed user);
    event HolderAdded(uint256 indexed taskId, address indexed holder);
    event HolderRemoved(uint256 indexed taskId, address indexed holder);

    constructor() ERC1155("https://lap.re/FL/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
    }

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        _mintBatch(to, ids, amounts, data);
    }

    // Function to burn token specifically for model access
    function burnForModelAccess(uint256 taskId, uint256 amount) public {
        burn(msg.sender, taskId, amount);
        emit ModelAccessUsed(taskId, msg.sender);
    }

    // Holder tracking helper functions
    function _addHolder(uint256 taskId, address holder) private {
        if (!_isHolder[taskId][holder]) {
            _taskHolders[taskId].push(holder);
            _holderIndices[taskId][holder] = _taskHolders[taskId].length;
            _isHolder[taskId][holder] = true;
            emit HolderAdded(taskId, holder);
        }
    }

    function _removeHolder(uint256 taskId, address holder) private {
        if (_isHolder[taskId][holder]) {
            uint256 index = _holderIndices[taskId][holder] - 1;
            uint256 lastIndex = _taskHolders[taskId].length - 1;
            address lastHolder = _taskHolders[taskId][lastIndex];

            if (index != lastIndex) {
                _taskHolders[taskId][index] = lastHolder;
                _holderIndices[taskId][lastHolder] = index + 1;
            }

            _taskHolders[taskId].pop();
            delete _holderIndices[taskId][holder];
            _isHolder[taskId][holder] = false;
            
            emit HolderRemoved(taskId, holder);
        }
    }

    // Query functions for holders
    function getTaskHolderCount(uint256 taskId) external view returns (uint256) {
        return _taskHolders[taskId].length;
    }

    function getTaskHolders(uint256 taskId) external view returns (address[] memory) {
        return _taskHolders[taskId];
    }

    function getTaskHoldersPaginated(
        uint256 taskId, 
        uint256 offset, 
        uint256 limit
    ) external view returns (
        address[] memory holders,
        uint256[] memory balances,
        uint256 total
    ) {
        uint256 totalHolders = _taskHolders[taskId].length;
        if (offset >= totalHolders) {
            return (new address[](0), new uint256[](0), totalHolders);
        }

        uint256 end = offset + limit;
        if (end > totalHolders) {
            end = totalHolders;
        }
        uint256 resultLength = end - offset;

        holders = new address[](resultLength);
        balances = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            address holder = _taskHolders[taskId][offset + i];
            holders[i] = holder;
            balances[i] = balanceOf(holder, taskId);
        }

        return (holders, balances, totalHolders);
    }

    function isTaskHolder(uint256 taskId, address account) external view returns (bool) {
        return _isHolder[taskId][account];
    }

    // Override required by Solidity for all inherited contracts
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Override _update from both ERC1155 and ERC1155Supply
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        // Update holder tracking before token transfer
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 taskId = ids[i];
            uint256 amount = values[i];

            // Remove from sender if balance will be 0
            if (from != address(0)) {
                uint256 fromBalance = balanceOf(from, taskId) - amount;
                if (fromBalance == 0) {
                    _removeHolder(taskId, from);
                }
            }

            // Add recipient if they'll have balance
            if (to != address(0)) {
                uint256 toBalance = balanceOf(to, taskId) + amount;
                if (toBalance > 0) {
                    _addHolder(taskId, to);
                }
            }
        }

        super._update(from, to, ids, values);
    }
}