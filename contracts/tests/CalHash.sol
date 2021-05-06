pragma solidity ^0.7.6;
import '../RenaswapV1Pair.sol';

contract CalHash {
     function getUniHash() public pure returns(bytes32){
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }

    function getRenaHash() public pure returns(bytes32){
        bytes memory bytecode = type(RenaswapV1Pair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}