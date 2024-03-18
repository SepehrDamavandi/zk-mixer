
const tree = require("./merkle-tree");


async function mixer(circuit){


    //You can comment out this function after the first run
    //await gen.generator();

    com0 = await tree.generateCommitment();
    console.log("depositing com0: ");
    ins0 = await tree.deposit(com0.commitment);
    
    
    com1 = await tree.generateCommitment();
    console.log("depositing com1: ");
    ins1 = await tree.deposit(com1.commitment);
    
    com2 = await tree.generateCommitment();
    console.log("depositing com2: ");
    ins2 = await tree.deposit(com2.commitment);
    
    com3 = await tree.generateCommitment();
    console.log("depositing com3: ");
    ins3 = await tree.deposit(com3.commitment);
    
    com4 = await tree.generateCommitment();
    console.log("depositing com4: ");
    ins4 = await tree.deposit(com4.commitment);
    
    com5 = await tree.generateCommitment();
    console.log("depositing com5: ");
    ins5 = await tree.deposit(com5.commitment);
    
    com6 = await tree.generateCommitment();
    console.log("depositing com6: ")
    ins6 = await tree.deposit(com6.commitment);
    //console.log(tree.getLastRoot());
    /*com7 = await tree.generateCommitment();
    ins7 = await tree.deposit(com7.commitment);
    console.log(tree.getLastRoot());*/
    
    path4 = await tree.path(com4.commitment);
    path0 = await tree.path(com0.commitment);
    path6 = await tree.path(com6.commitment);

    let privateInputs4 = {
        nullifier: com4.nullifier,
        secret: com4.secret,
        pathElements: path4.pathElements,
        pathIndices: path4.pathIndices
    };
    let proof4 = (await tree.generateProof(privateInputs4));
    console.log("withdrawing for com4: ");
    await tree.withdraw(proof4.proof,proof4.publicSignals);

    let privateInputs0 = {
        nullifier: com0.nullifier,
        secret: com0.secret,
        pathElements: path0.pathElements,
        pathIndices: path0.pathIndices
    };
    let proof0 = (await tree.generateProof(privateInputs0));
    console.log("withdrawing for com0: ");
    await tree.withdraw(proof0.proof,proof0.publicSignals);
    

    let privateInputs6 = {
        nullifier: com6.nullifier,
        secret: com6.secret,
        pathElements: path6.pathElements,
        pathIndices: path6.pathIndices
    };
    let proof6 = (await tree.generateProof(privateInputs6));
    console.log("withdrawing for com6: ");
    await tree.withdraw(proof6.proof,proof6.publicSignals);

    path1 = await tree.path(com1.commitment);
    path2 = await tree.path(com2.commitment);
    path3 = await tree.path(com3.commitment);
    path5 = await tree.path(com5.commitment);
    //path7 = await tree.path(com7.commitment);

    let privateInputs1 = {
        nullifier: com1.nullifier,
        secret: com1.secret,
        pathElements: path0.pathElements,
        pathIndices: path1.pathIndices
    };
    let proof1 = (await tree.generateProof(privateInputs1));
    console.log("withdrawing for com1 with invalid  private inputs: ");
    await tree.withdraw(proof1.proof,proof1.publicSignals);

    let privateInputs2 = {
        nullifier: com2.nullifier,
        secret: com2.secret,
        pathElements: path2.pathElements,
        pathIndices: path2.pathIndices
    };
    let proof2 = (await tree.generateProof(privateInputs2));
    console.log("withdrawing for com2 with invalid proof: ");
    await tree.withdraw(proof6.proof,proof2.publicSignals);

    let privateInputs3 = {
        nullifier: com3.nullifier,
        secret: com3.secret,
        pathElements: path3.pathElements,
        pathIndices: path3.pathIndices
    };
    let proof3 = (await tree.generateProof(privateInputs3));
    console.log("withdrawing for com3: ");
    await tree.withdraw(proof3.proof,proof3.publicSignals);

    let privateInputs5 = {
        nullifier: com5.nullifier,
        secret: com5.secret,
        pathElements: path5.pathElements,
        pathIndices: path5.pathIndices
    };
    let proof5 = (await tree.generateProof(privateInputs5));
    console.log("withdrawing for com5: ");
    await tree.withdraw(proof5.proof,proof5.publicSignals);

    console.log("withdrawing for com5 again!!: ");
    await tree.withdraw(proof5.proof,proof5.publicSignals);

    /*let privateInputs7 = {
        nullifier: com7.nullifier,
        secret: com7.secret,
        pathElements: path7.pathElements,
        pathIndices: path7.pathIndices
    };
    let proof7 = (await tree.generateProof(privateInputs7));
    console.log("withdrawing for com7: ");
    await tree.withdraw(proof7.proof,proof7.publicSignals);*/
 
}
mixer('circuit').then((circuit)=>{
    process.exit(0);
})


