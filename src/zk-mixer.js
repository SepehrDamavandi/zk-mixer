const gen = require("./1_generate_keys");
const tree = require("./tree");

async function mixer(circuit){


    //You can comment out this function after the first run
    await gen.generator();

    let com1 = (await tree.generateCommitment());
    let ins1 = (await tree.insert(com1.commitment))
    let privateInputs1 = {
        nullifier: com1.nullifier,
        secret: com1.secret,
        pathElements: ins1.hashPairings,
        pathIndices: ins1.hashDirections
    };
    let proof1 = (await tree.generateProof(privateInputs1));
    //console.log(privateInputs1);
    //console.log(proof1);
    await tree.withdraw(proof1.proof,proof1.publicSignals);

    let com2 = (await tree.generateCommitment());
    let ins2 = (await tree.insert(com2.commitment))
    let privateInputs2 = {
        nullifier: com2.nullifier,
        secret: com2.secret,
        //invalid input:
        pathElements: ins1.hashPairings,
        pathIndices: ins2.hashDirections
    };
    let proof2 = (await tree.generateProof(privateInputs2));
    //console.log(privateInputs2);
    //console.log(proof2);
    await tree.withdraw(proof2.proof,proof2.publicSignals);
    //**This will log 'invalid root' because circuit inputs are invalid, so it will generate and prove a
    //wrong MerkleRoot which is not in the roots array on the backend


    let com3 = (await tree.generateCommitment());
    let ins3 = (await tree.insert(com3.commitment))
    let privateInputs3 = {
        nullifier: com3.nullifier,
        secret: com3.secret,
        pathElements: ins3.hashPairings,
        pathIndices: ins3.hashDirections
    };
    let proof3 = (await tree.generateProof(privateInputs3));
    //console.log(privateInputs3);
    //console.log(proof3);
    await tree.withdraw(proof3.proof,proof1.publicSignals);
    //**This will log 'invalid proof' because of the wrong public signals given to the verifier
    
}
mixer('circuit').then((circuit)=>{
    process.exit(0);
})


