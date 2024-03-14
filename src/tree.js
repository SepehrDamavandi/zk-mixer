
const crypto = require('crypto');
const snarkjs = require("snarkjs");
const circomlibjs = require('circomlibjs');
const ethers = require('ethers');
const { error } = require('console');
const fs = require("fs");


const ZERO_VALUE = ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292'); // = keccak256("tornado") % FIELD_SIZE
let treeLevel = 3;
let nextLeafIndex = 0;
//mapping (uint256 => bool)
let roots = [];
//mapping(uint8 => uint256) lastLevelHash
let lastLevelHash = [treeLevel];
//mapping(uint256 => bool) public commitments;
let commitments = [];
//mapping(uint256 => bool) public nullifierHashes;
let nullifierHashes = [];

//toBigInt() to convert to BigInt if there were inconsistensies
let zeros = [
    ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292').toString(),
    ethers.BigNumber.from('16923532097304556005972200564242292693309333953544141029519619077135960040221').toString(),
    ethers.BigNumber.from('7833458610320835472520144237082236871909694928684820466656733259024982655488').toString(),
    ethers.BigNumber.from('14506027710748750947258687001455876266559341618222612722926156490737302846427').toString(),
    ethers.BigNumber.from('4766583705360062980279572762279781527342845808161105063909171241304075622345').toString(),
    ethers.BigNumber.from('16640205414190175414380077665118269450294358858897019640557533278896634808665').toString(),
]


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

function calculateHash(mimc, left, right){
    return ethers.BigNumber.from(mimc.F.toString(mimc.multiHash([left, right])))
}

async function generateZeros(levels){
    const mimc = await circomlibjs.buildMimcSponge();
    let zeros = [];
    zeros[0] = ZERO_VALUE;
    for (let i = 1; i <= levels; i++)
        zeros[i] = calculateHash(mimc, zeros[i - 1], zeros[i - 1]);
    return zeros;
}

async function insert(_leaf){
    const mimc = await circomlibjs.buildMimcSponge();
    if(nextLeafIndex === 2**treeLevel){return error("Tree is full")}
    if(contains(commitments,_leaf)===true){return error("redundent commitment")}
    let newRoot;
    let hashPairings = [treeLevel];
    let hashDirections = [treeLevel];
    let currentIndex = nextLeafIndex;
    let currentHash = _leaf;
    let left;
    let right;

    for(let i = 0; i<treeLevel; i++){
        if(currentIndex % 2 === 0){
            left = currentHash;
            right = zeros[i];
            hashPairings[i] = zeros[i];
            hashDirections[i] = 0;
        } else {
            left = lastLevelHash[i];
            right = currentHash;
            hashPairings[i] = lastLevelHash[i];
            hashDirections[i] = 1;
        }
        lastLevelHash[i]= currentHash;
        let h = ethers.BigNumber.from(mimc.F.toString(mimc.multiHash([left, right]))).toString();
        currentHash = h;
        currentIndex = Math.floor(currentIndex / 2);
    }
    newRoot = currentHash.toString();
    roots.push(currentHash);
    nextLeafIndex += 1;
    commitments.push(_leaf);

    return({
        hashPairings,
        hashDirections,
        index: nextLeafIndex - 1 
    });
    
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}

async function generateProof(inputs){
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, "./circuit_compiled/Withdraw.wasm", "./keys/Withdraw_final.zkey");
    console.log("Proof & publicInput Generated!");
    return {proof, publicSignals};

}

async function withdraw(proof, publicInputs){
    if(contains(nullifierHashes,publicInputs[0])===true){return error("Nullifier already spent")};
    if(contains(roots,publicInputs[1])===false){return error("invalid root")};
    const vKey = JSON.parse(fs.readFileSync(`./keys/Withdraw_verification_key.json`));
    const res = await snarkjs.groth16.verify(vKey, publicInputs, proof);
    if (res === true) {
        console.log("Proof verified successfully");
        nullifierHashes.push(publicInputs[1]);
    } else {
        console.log("Invalid proof");
    }
}



module.exports = {generateCommitment, insert, generateProof, withdraw};