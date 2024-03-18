const crypto = require('crypto');
const snarkjs = require("snarkjs");
const circomlibjs = require('circomlibjs');
const ethers = require('ethers');
const { error } = require('console');
const fs = require("fs");

//This is just a default value for empty leafs
const ZERO_VALUE = ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292'); // = keccak256("tornado") % FIELD_SIZE
let zeros = [
    ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292').toString(),
    ethers.BigNumber.from('16923532097304556005972200564242292693309333953544141029519619077135960040221').toString(),
    ethers.BigNumber.from('7833458610320835472520144237082236871909694928684820466656733259024982655488').toString(),
    ethers.BigNumber.from('14506027710748750947258687001455876266559341618222612722926156490737302846427').toString(),
    ethers.BigNumber.from('4766583705360062980279572762279781527342845808161105063909171241304075622345').toString(),
    ethers.BigNumber.from('16640205414190175414380077665118269450294358858897019640557533278896634808665').toString(),
]

//uint32 public levels;
let levels = 3;

//mapping(bytes32 => bool) public nullifierHashes;
let nullifierHashes = [];

// we store all commitments just to prevent accidental deposits with the same commitment:
//mapping(bytes32 => bool) public commitments;
let commitments = [];

//IHasher _hasher
function calculateHash(mimc, left, right){
    return mimc.F.toString(mimc.multiHash([left, right]))
}

//mapping(uint256 => bytes32) public filledSubtrees;
filledSubtrees = [];

//mapping(uint256 => bytes32) public roots;
roots = [];

//uint32 public constant ROOT_HISTORY_SIZE = 30;
//lets go with 2
const ROOT_HISTORY_SIZE = 2;

//uint32 public currentRootIndex = 0;
let currentRootIndex = 0;

//uint32 public nextIndex = 0;
let nextIndex = 0;

for (let i = 0; i < levels; i++) {
    filledSubtrees[i] = zeros[i];
  }

//why?
roots[0] = zeros[levels-1];

async function deposit(_commitment){
    if(contains(commitments,_commitment)===true){return error("commitment already exists")}
    //int32 insertedIndex = _insert(_commitment);
    let _nextIndex = nextIndex;
    if(_nextIndex == 2**levels){return error("Merkle tree is full, no more leaves to be added")}
    let currentIndex = _nextIndex;
    let currentLevelHash = _commitment;
    let left;
    let right;
    const mimc = await circomlibjs.buildMimcSponge();


    for(let i=0; i<levels; i++){
        if(currentIndex % 2 == 0){
            left = currentLevelHash;
            right = zeros[i];
            filledSubtrees[i] = currentLevelHash;
        }else{
            left = filledSubtrees[i];
            right = currentLevelHash;
        }
        currentLevelHash = calculateHash(mimc, left, right).toString();
        currentIndex = Math.floor(currentIndex / 2); 
    }
    let newRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
    currentRootIndex = newRootIndex;
    roots[newRootIndex] = currentLevelHash;
    nextIndex = _nextIndex +1;
    

    commitments.push(_commitment);
    console.log("deposit successfull\n");
    
    return{
        //event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
        commitment: _commitment,
        leafIndex: nextIndex-1,
        timestamp: Math.floor(Date.now() / 1000)
    }
}

function isKnownRoot(_root){
    if(_root === 0){return false};
    let _currentRootIndex = currentRootIndex;
    let i = currentRootIndex;
    do{
        if(_root == roots[i]){
            return true;
        }
        if(i==0){
            i = ROOT_HISTORY_SIZE;
        }
        i--;
    }while( i != _currentRootIndex);
    return false;
}

function getLastRoot(){
    return roots[currentRootIndex];
}

async function generateCommitment() {
    const mimc = await circomlibjs.buildMimcSponge();
    const nullifier = ethers.BigNumber.from(crypto.randomBytes(31)).toString()
    const secret = ethers.BigNumber.from(crypto.randomBytes(31)).toString()
    const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]))
    const nullifierHash = mimc.F.toString(mimc.multiHash([nullifier]))
    return {
        nullifier: nullifier,
        secret: secret,
        commitment: commitment,
        nullifierHash: nullifierHash
    }
}

//async function path ()


function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
};
function getCommitments(){
    return commitments;
}

async function path(commitment){
    let index = commitments.indexOf(commitment);
    //console.log(index);
    const mimc = await circomlibjs.buildMimcSponge();
    let layers=[];
    layers[0] = commitments.slice();
    //console.log(layers[0]==commitments);
    //console.log(layers[0]);
    //console.log(commitments);
    //console.log(layers[0].length)
    for(let level = 1; level <= levels; level++){
        layers[level] = [];
        for (let i = 0; i < Math.ceil(layers[level - 1].length / 2); i++){
            layers[level][i] = calculateHash(
                mimc,
                layers[level-1][i*2],
                i * 2 + 1 < layers[level - 1].length ? layers[level - 1][i * 2 + 1] : zeros[level - 1]
            ).toString();
        }
        //console.log(`layers[${level}]: `);
        //console.log(layers[level]);
    }

    const root = layers[levels].length > 0 ? layers[levels][0] : zeros[levels - 1];
    let pathElements = [];
    let pathIndices = [];

    for (let level = 0; level < levels; level++) {
        pathIndices[level] = index % 2;
        pathElements[level] = (index ^ 1) < layers[level].length ? layers[level][index ^ 1] : zeros[level];
        index >>= 1;
        
    }
    
    return {
        root: root,
        pathElements: pathElements,
        pathIndices: pathIndices
    }
}

async function withdraw(proof, publicInputs){
    if(contains(nullifierHashes,publicInputs[0])===true){return error("Nullifier already spent \n")};
    if(roots[0] !== publicInputs[1] && roots[1] !== publicInputs[1]){return error("invalid root \n")};
    const vKey = JSON.parse(fs.readFileSync(`./keys/Withdraw_verification_key.json`));
    const res = await snarkjs.groth16.verify(vKey, publicInputs, proof);
    if (res === true) {
        console.log("Proof verified successfully, withdraw succesfull \n");
        nullifierHashes.push(publicInputs[0]);
    } else {
        console.log("Invalid proof \n");
    }    
}
async function generateProof(inputs){
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, "./circuit_compiled/Withdraw.wasm", "./keys/Withdraw_final.zkey");
    console.log("Proof & publicInput Generated!");
    return {proof, publicSignals};

}

module.exports = {deposit, isKnownRoot, getLastRoot, generateCommitment, getCommitments, path, withdraw, generateProof};

